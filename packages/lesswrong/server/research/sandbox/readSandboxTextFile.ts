import type { Sandbox } from "@vercel/sandbox";
import { SANDBOX_DEFAULT_DIR } from "./listSandboxDirectory";

/** Read at most this many bytes; larger files are shown truncated. */
export const SANDBOX_FILE_MAX_BYTES = 512 * 1024;

export interface SandboxFileContents {
  /** Byte size of the full file on disk. */
  size: number;
  /** File text (up to SANDBOX_FILE_MAX_BYTES). Empty for binary/empty files. */
  content: string;
  /** True when `content` is only the leading SANDBOX_FILE_MAX_BYTES of a larger file. */
  truncated: boolean;
  /** True when the file looks binary (not viewable as text). */
  binary: boolean;
}

/**
 * Read a text file from a sandbox for the read-only viewer. Confined to
 * `SANDBOX_DEFAULT_DIR` by an in-sandbox realpath + prefix check (symlinks and
 * `..` can't escape), reports binary files rather than dumping bytes, and caps
 * the read at SANDBOX_FILE_MAX_BYTES (larger files come back `truncated`).
 *
 * The command emits the on-disk size on a `__SIZE__` stderr line and the file
 * bytes on stdout, so a truncated read still reports the true size.
 */
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
