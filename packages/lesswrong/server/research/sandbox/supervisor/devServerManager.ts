/**
 * Supervisor-owned dev-server lifecycle.
 *
 * The agent declares how to start its app's dev server in
 * `/vercel/sandbox/dev-server.sh` — a plain foreground command (ideally
 * `exec`-ing the server). The supervisor runs that script as a child it owns,
 * restarts it if it exits, captures its output to a log the agent can read, and
 * exposes start/stop/restart so the agent never has to background the process
 * itself.
 *
 * If no `dev-server.sh` is present (e.g. an environment whose `init.sh` still
 * launches the server itself), the manager stays idle and leaves that
 * arrangement untouched.
 */
import { createServer, Server } from "node:http";
import { spawn, SpawnOptions } from "node:child_process";
import { existsSync, openSync, closeSync, readFileSync } from "node:fs";
import { AGENT_CWD } from "../sandboxLayout";
import { startDevPortProbe, DevServerHandle, DEV_PORT, buildScriptBootEnv } from "./devServer";

const DEV_SCRIPT_PATH = `${AGENT_CWD}/dev-server.sh`;
const DEV_LOG_PATH = `${AGENT_CWD}/dev.log`;

/** Local-only port for the dev-server control surface. */
export const DEV_CONTROL_PORT = 9283;

/** Backoff between automatic restarts; index clamps to the last entry. */
const BACKOFF_MS = [1_000, 2_000, 5_000, 10_000];
/** A run that lasts at least this long is treated as healthy (resets backoff). */
const HEALTHY_RUN_MS = 30_000;
/** Crash-loop window and the restart count within it that pauses supervision. */
const CRASH_WINDOW_MS = 60_000;
const CRASH_LIMIT = 5;
/** Grace period after SIGTERM before SIGKILL when stopping/restarting. */
const STOP_GRACE_MS = 5_000;

export interface DevServerManager extends DevServerHandle {
  /** Resume supervision and ensure the server is running. */
  start(): void;
  /** Suspend supervision and stop the server until an explicit `start`. */
  stop(): void;
  /** Restart the server, keeping supervision on. */
  restart(): void;
  /** Whether a `dev-server.sh` exists for the manager to supervise. */
  hasScript(): boolean;
}

/** Emits a one-line system event to the transcript (e.g. crash-loop notices). */
type SurfaceFn = (text: string) => void;

type SpawnDevProcess = (
  command: string,
  args: string[],
  options: SpawnOptions,
) => ManagedDevProcess;

interface ManagedDevProcess {
  pid?: number;
  on(event: "error", listener: (err: Error) => void): this;
  on(event: "exit", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
  unref(): void;
}

interface DevServerManagerOptions {
  devScriptPath?: string;
  devLogPath?: string;
  cwd?: string;
  spawnProcess?: SpawnDevProcess;
  probe?: DevServerHandle;
  now?: () => number;
}

function signalGroup(pid: number, signal: NodeJS.Signals): void {
  // The child is spawned `detached`, so it leads its own process group; the
  // negative pid signals the whole tree even when the script doesn't `exec`.
  try {
    process.kill(-pid, signal);
  } catch {
    try {
      process.kill(pid, signal);
    } catch {
      /* already gone */
    }
  }
}

function tailFile(filePath: string, lines = 20): string {
  try {
    return readFileSync(filePath, "utf8").split("\n").slice(-lines).join("\n").trim();
  } catch {
    return "";
  }
}

function closeFdSafely(fd: number): void {
  try {
    closeSync(fd);
  } catch {
    /* already closed */
  }
}

export function createDevServerManager(
  surface: SurfaceFn,
  options: DevServerManagerOptions = {},
): DevServerManager {
  const probe = options.probe ?? startDevPortProbe(DEV_PORT);
  const childEnv = buildScriptBootEnv();
  const devScriptPath = options.devScriptPath ?? DEV_SCRIPT_PATH;
  const devLogPath = options.devLogPath ?? DEV_LOG_PATH;
  const cwd = options.cwd ?? AGENT_CWD;
  const spawnProcess = options.spawnProcess ?? spawn;
  const now = options.now ?? Date.now;

  let child: ManagedDevProcess | null = null;
  /** Whether we want the server up. start/restart set true; stop sets false. */
  let desiredRunning = false;
  /** True between issuing a kill and seeing its exit, so the exit isn't crash-counted. */
  let killing = false;
  let killGraceTimer: NodeJS.Timeout | null = null;
  let restartTimer: NodeJS.Timeout | null = null;
  let consecutiveFailures = 0;
  let launchedAt = 0;
  /** Launch timestamps within the crash window, for loop detection. */
  const recentStarts: number[] = [];

  function hasScript(): boolean {
    return existsSync(devScriptPath);
  }

  function clearRestartTimer(): void {
    if (restartTimer) {
      clearTimeout(restartTimer);
      restartTimer = null;
    }
  }

  function launch(): void {
    if (child || killing) return;
    if (!hasScript()) return;

    let fd: number;
    try {
      // Truncate per launch so the log reflects the current run.
      fd = openSync(devLogPath, "w");
    } catch (err) {
      surface(`dev server: could not open ${devLogPath}: ${(err as Error).message}`);
      return;
    }

    launchedAt = now();
    recentStarts.push(launchedAt);

    let proc: ManagedDevProcess;
    try {
      proc = spawnProcess("sh", [devScriptPath], {
        cwd,
        env: childEnv,
        stdio: ["ignore", fd, fd],
        detached: true,
      });
    } catch (err) {
      surface(`dev server failed to start: ${(err as Error).message}`);
      closeFdSafely(fd);
      return;
    }
    closeFdSafely(fd);
    child = proc;
    // The supervisor still tracks the child for exit/stop/restart, but the child
    // should not keep the supervisor event loop alive or inherit its lifetime.
    proc.unref();

    proc.on("error", (err) => {
      surface(`dev server failed to start: ${err.message}`);
    });
    proc.on("exit", (code, signal) => onChildExit(proc, code, signal));
  }

  function onChildExit(
    proc: ManagedDevProcess,
    code: number | null,
    signal: NodeJS.Signals | null,
  ): void {
    if (child !== proc) return;
    child = null;
    if (killGraceTimer) {
      clearTimeout(killGraceTimer);
      killGraceTimer = null;
    }
    if (killing) {
      // Intentional kill (stop/restart): not a crash. Let reconcile decide the
      // next step (relaunch if we still want it up, e.g. a restart).
      killing = false;
      reconcile();
      return;
    }
    // Exited on its own. If we no longer want it up, leave it down.
    if (!desiredRunning) return;
    scheduleRestartAfterCrash(code, signal);
  }

  function scheduleRestartAfterCrash(code: number | null, signal: NodeJS.Signals | null): void {
    // A run that lasted long enough to be healthy earns a fresh crash budget, so
    // a stable stretch isn't tripped by crashes from before it.
    if (now() - launchedAt > HEALTHY_RUN_MS) {
      consecutiveFailures = 0;
      recentStarts.length = 0;
    }

    const cutoff = now() - CRASH_WINDOW_MS;
    while (recentStarts.length > 0 && recentStarts[0] < cutoff) recentStarts.shift();
    if (recentStarts.length >= CRASH_LIMIT) {
      desiredRunning = false;
      const how = signal ? `signal ${signal}` : `code ${code}`;
      const log = tailFile(devLogPath);
      surface(
        `Dev server is crash-looping (exited ${how} ${recentStarts.length} times in ` +
          `${CRASH_WINDOW_MS / 1000}s); supervision paused. Fix dev-server.sh and run ` +
          "`research-tool dev start`." +
          (log ? `\nRecent dev.log:\n${log}` : ""),
      );
      return;
    }

    const delay = BACKOFF_MS[Math.min(consecutiveFailures, BACKOFF_MS.length - 1)];
    consecutiveFailures += 1;
    clearRestartTimer();
    restartTimer = setTimeout(() => {
      restartTimer = null;
      reconcile();
    }, delay);
    restartTimer.unref?.();
  }

  function beginKill(): void {
    if (!child || child.pid == null) return;
    killing = true;
    const pid = child.pid;
    signalGroup(pid, "SIGTERM");
    killGraceTimer = setTimeout(() => signalGroup(pid, "SIGKILL"), STOP_GRACE_MS);
    killGraceTimer.unref?.();
  }

  /** Drive the child toward `desiredRunning`. Waits for any in-flight kill's exit. */
  function reconcile(): void {
    if (killing) return;
    if (desiredRunning) {
      if (!child) launch();
    } else if (child) {
      beginKill();
    }
  }

  function start(): void {
    desiredRunning = true;
    consecutiveFailures = 0;
    recentStarts.length = 0;
    clearRestartTimer();
    reconcile();
  }

  function stop(): void {
    desiredRunning = false;
    clearRestartTimer();
    reconcile();
  }

  function restart(): void {
    desiredRunning = true;
    consecutiveFailures = 0;
    recentStarts.length = 0;
    clearRestartTimer();
    // Kill the current child; its exit reconciles back to a fresh launch.
    if (child) beginKill();
    else reconcile();
  }

  return { isListening: probe.isListening, hasScript, start, stop, restart };
}

/**
 * Local-only HTTP control surface for the dev server. Bound to 127.0.0.1 on a
 * port that is *not* in the sandbox's public port list, so it needs no auth —
 * only the in-sandbox agent (via `research-tool dev …`) and the supervisor can
 * reach it.
 */
export function startDevControlServer(manager: DevServerManager): Server {
  const server = createServer((req, res) => {
    const method = req.method ?? "GET";
    const requestPath = (req.url ?? "/").split("?")[0];
    if (method !== "POST") {
      res.statusCode = 405;
      res.end();
      return;
    }
    const action =
      requestPath === "/start"
        ? "start"
        : requestPath === "/stop"
        ? "stop"
        : requestPath === "/restart"
        ? "restart"
        : null;
    if (!action) {
      res.statusCode = 404;
      res.end();
      return;
    }
    try {
      if (action === "start") manager.start();
      else if (action === "stop") manager.stop();
      else manager.restart();
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      // `managed: false` means no dev-server.sh — the controls did nothing.
      res.end(JSON.stringify({ ok: true, action, managed: manager.hasScript() }));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, error: (err as Error).message }));
    }
  });
  server.listen(DEV_CONTROL_PORT, "127.0.0.1");
  return server;
}
