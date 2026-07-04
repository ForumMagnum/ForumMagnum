import type { Sandbox } from "@vercel/sandbox";
import { SANDBOX_DEFAULT_DIR } from "./listSandboxDirectory";

export const SANDBOX_FILE_MAX_BYTES = 512 * 1024;

export interface SandboxFileContents {
  size: number;
  content: string;
  truncated: boolean;
  binary: boolean;
}

export async function readSandboxTextFile(
  sandbox: Sandbox,
  path: string,
): Promise<SandboxFileContents> {
  const script =
    `set -e; ` +
    `root=$(realpath "${SANDBOX_DEFAULT_DIR}"); ` +
    `target=$(realpath "$1" 2>/dev/null) || { echo "__ENOENT__" >&2; exit 3; }; ` +
    `case "$target" in "$root"|"$root"/*) ;; *) echo "__ESCAPE__" >&2; exit 4;; esac; ` +
    `[ -f "$target" ] || { echo "__ENOTFILE__" >&2; exit 5; }; ` +
    `size=$(stat -c %s "$target"); ` +
    // Emit the size before the binary check so binary files still report
    // their true on-disk size.
    `echo "__SIZE__ $size" >&2; ` +
    // grep -I treats a binary file as non-matching; `. ` matches any line of a
    // non-empty text file. Skip the check for empty files (they're valid text).
    `if [ "$size" -gt 0 ] && ! grep -qI . "$target"; then echo "__BINARY__" >&2; exit 7; fi; ` +
    `head -c ${SANDBOX_FILE_MAX_BYTES} "$target"`;
  const result = await sandbox.runCommand({
    cmd: "bash",
    args: ["-c", script, "bash", path],
  });
  if (result.exitCode !== 0) {
    const stderr = (await result.stderr()).trim();
    if (stderr.includes("__ESCAPE__")) throw new Error("Path is outside the sandbox workspace");
    if (stderr.includes("__ENOENT__")) throw new Error("File does not exist");
    if (stderr.includes("__ENOTFILE__")) throw new Error("Path is not a regular file");
    if (stderr.includes("__BINARY__")) {
      const sizeMatch = stderr.match(/__SIZE__ (\d+)/);
      return {
        size: sizeMatch ? Number(sizeMatch[1]) : 0,
        content: "",
        truncated: false,
        binary: true,
      };
    }
    throw new Error(`Failed to read file (exit ${result.exitCode}): ${stderr.slice(0, 500)}`);
  }
  const stderr = await result.stderr();
  const sizeMatch = stderr.match(/__SIZE__ (\d+)/);
  const size = sizeMatch ? Number(sizeMatch[1]) : 0;
  const content = await result.stdout();
  return {
    size,
    content,
    truncated: size > SANDBOX_FILE_MAX_BYTES,
    binary: false,
  };
}
