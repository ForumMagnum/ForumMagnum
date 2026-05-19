/**
 * Dev server child process. Runs inside the sandbox, alongside the supervisor.
 *
 * For a coding conversation whose repo defines a `devCommand`, the supervisor
 * spawns that command as a child process on every boot. Because the supervisor
 * is relaunched on every provision and resume, the dev server is restored
 * automatically each time with no agent action and no browser trigger.
 *
 * The dev server is expected to bind a localhost port (`DEV_PORT`); the
 * auth-proxy (`./authProxy.ts`) is what exposes it to the internet, gated.
 */
import { ChildProcess, spawn } from "node:child_process";
import { Socket } from "node:net";

export interface DevServerConfig {
  /** The repo's `devCommand`, run via `sh -c`. */
  command: string;
  /** localhost port the dev server is expected to bind. */
  port: number;
  /** Working directory — `dirname(lockfilePath)` within the clone. */
  cwd: string;
  /** Extra environment for the dev process (e.g. the repo's `.env` values). */
  env: Record<string, string>;
}

export interface DevServerHandle {
  /** True when something is accepting TCP connections on the dev port. */
  isListening(): Promise<boolean>;
  stop(): void;
}

/** Delay before respawning a dev server that has exited. */
const RESTART_DELAY_MS = 3000;
/** How long to wait for a single connection probe. */
const PROBE_TIMEOUT_MS = 1000;
/** How long a probe result is reused — the auth-proxy probes per request. */
const PROBE_CACHE_MS = 1500;

function probePort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new Socket();
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(PROBE_TIMEOUT_MS);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
    socket.connect(port, "127.0.0.1");
  });
}

/**
 * Spawn the repo's dev server as a child process and keep it alive: if it
 * exits, it is respawned after a short delay, so a crash does not permanently
 * take the preview down. Runs for the supervisor's lifetime.
 */
export function startDevServer(config: DevServerConfig): DevServerHandle {
  let child: ChildProcess | null = null;
  let stopped = false;
  let restartTimer: NodeJS.Timeout | null = null;

  const spawnOnce = () => {
    if (stopped) return;
    // eslint-disable-next-line no-console
    console.log(`[devserver] starting: ${config.command}`);
    child = spawn("sh", ["-c", config.command], {
      cwd: config.cwd,
      // `PORT` is the convention most dev servers (Next, Vite, CRA) honor.
      env: { ...process.env, ...config.env, PORT: String(config.port) },
      stdio: ["ignore", "inherit", "inherit"],
    });
    child.on("exit", (code) => {
      // eslint-disable-next-line no-console
      console.log(`[devserver] exited (code ${code})`);
      child = null;
      if (!stopped) restartTimer = setTimeout(spawnOnce, RESTART_DELAY_MS);
    });
  };
  spawnOnce();

  // The auth-proxy calls `isListening` on every proxied request; cache the
  // probe (the in-flight promise, so concurrent requests share one) briefly so
  // a page load's burst of sub-resource requests does not each open a socket.
  let probeInFlight: { promise: Promise<boolean>; at: number } | null = null;
  const isListening = (): Promise<boolean> => {
    const now = Date.now();
    if (probeInFlight && now - probeInFlight.at < PROBE_CACHE_MS) {
      return probeInFlight.promise;
    }
    const promise = probePort(config.port);
    probeInFlight = { promise, at: now };
    return promise;
  };

  return {
    isListening,
    stop: () => {
      stopped = true;
      if (restartTimer) clearTimeout(restartTimer);
      child?.kill("SIGTERM");
    },
  };
}
