import { Sandbox } from "@vercel/sandbox";
import { getRunningSandbox, sandboxNameForConversation } from "./sandboxManager";

/**
 * Run a one-shot shell command inside a conversation's sandbox and return its
 * captured output. This is the out-of-band exec channel behind
 * `research-tool exec` / `kill`: it rides the Vercel `sandbox-init` control
 * socket (a fresh task scheduled by PID 1), so it stays responsive and can reap
 * a runaway even when the app / supervisor inside the sandbox is wedged.
 *
 * By default it attaches to the *currently running* session and does NOT resume
 * a stopped sandbox: a stopped sandbox has no live process to inspect or kill,
 * and resuming would boot a fresh session (and can roll the sole retained
 * snapshot). Pass `resumeIfStopped` to override for inspection use-cases.
 */

/** Cap returned output so a chatty command can't hand back megabytes. */
const MAX_OUTPUT_CHARS = 100_000;
const DEFAULT_EXEC_TIMEOUT_MS = 60_000;
const MAX_EXEC_TIMEOUT_MS = 5 * 60_000;

export interface ExecInSandboxParams {
  cmd: string;
  args?: string[];
  cwd?: string;
  sudo?: boolean;
  timeoutMs?: number;
  resumeIfStopped?: boolean;
}

export type ExecInSandboxResult =
  | { kind: "notRunning" }
  | { kind: "notFound" }
  | { kind: "timedOut"; timeoutMs: number; resumed: boolean }
  | {
      kind: "ran";
      exitCode: number;
      stdout: string;
      stderr: string;
      truncated: boolean;
      resumed: boolean;
    };

interface ClippedOutput {
  text: string;
  truncated: boolean;
}

// Keep the tail: for `ps`/logs the recent lines are the interesting ones.
function clip(value: string): ClippedOutput {
  if (value.length <= MAX_OUTPUT_CHARS) return { text: value, truncated: false };
  return { text: value.slice(value.length - MAX_OUTPUT_CHARS), truncated: true };
}

export async function execInConversationSandbox(
  conversationId: string,
  params: ExecInSandboxParams,
): Promise<ExecInSandboxResult> {
  let sandbox = await getRunningSandbox(conversationId);
  let resumed = false;

  if (!sandbox) {
    if (!params.resumeIfStopped) {
      // `getRunningSandbox` maps both "no such sandbox" and "stopped" to null;
      // the caller surfaces the resume hint rather than us guessing which.
      return { kind: "notRunning" };
    }
    try {
      sandbox = await Sandbox.get({ name: sandboxNameForConversation(conversationId), resume: true });
      resumed = true;
    } catch {
      return { kind: "notFound" };
    }
  }

  const timeoutMs = Math.min(params.timeoutMs ?? DEFAULT_EXEC_TIMEOUT_MS, MAX_EXEC_TIMEOUT_MS);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const result = await sandbox.runCommand({
      cmd: params.cmd,
      args: params.args ?? [],
      ...(params.cwd ? { cwd: params.cwd } : {}),
      ...(params.sudo ? { sudo: true } : {}),
      signal: controller.signal,
    });
    const stdout = clip(await result.stdout());
    const stderr = clip(await result.stderr());
    return {
      kind: "ran",
      exitCode: result.exitCode,
      stdout: stdout.text,
      stderr: stderr.text,
      truncated: stdout.truncated || stderr.truncated,
      resumed,
    };
  } catch (err) {
    if (controller.signal.aborted) {
      return { kind: "timedOut", timeoutMs, resumed };
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
