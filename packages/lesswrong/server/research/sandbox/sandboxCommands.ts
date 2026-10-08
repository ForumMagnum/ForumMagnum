import type { Sandbox } from "@vercel/sandbox";

/**
 * Run a command in a sandbox and throw a readable error if it exits non-zero.
 * Shared by the install-cache builder and a coding conversation's first-provision
 * setup — both drive a sandbox through a sequence of must-succeed commands.
 */
export async function runSandboxCommandOrThrow(
  sandbox: Sandbox,
  opts: { cmd: string; args: string[]; cwd?: string; env?: Record<string, string> },
  label: string,
): Promise<void> {
  const result = await sandbox.runCommand(opts);
  if (result.exitCode !== 0) {
    const stderr = await result.stderr();
    throw new Error(`${label} failed (exit ${result.exitCode}): ${stderr.slice(0, 2000)}`);
  }
}
