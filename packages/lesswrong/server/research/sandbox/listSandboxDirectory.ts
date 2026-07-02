import type { Sandbox } from "@vercel/sandbox";

export interface SandboxDirEntry {
  name: string;
  /** "directory" | "file" | "symlink" | "other" */
  kind: string;
  /** Byte size for files; null for directories and unstattable entries. */
  size: number | null;
}

/** Default working directory a conversation's repo/scratch lives under. */
export const SANDBOX_DEFAULT_DIR = "/vercel/sandbox";

// GNU find -printf type chars → our kind strings.
function kindFromTypeChar(c: string): string {
  if (c === "d") return "directory";
  if (c === "f") return "file";
  if (c === "l") return "symlink";
  return "other";
}

/**
 * List a single directory level in a sandbox (non-recursive; the client lazy-
 * loads deeper levels on expand). Read-only — runs `find -maxdepth 1`, which
 * emits one tab-separated `type\tsize\tname` line per child. Directories sort
 * first, then names, both case-insensitively.
 *
 * `path` is resolved and confined to `SANDBOX_DEFAULT_DIR`: the model-facing
 * surface is the workspace, and this keeps a crafted `..`/absolute path from
 * walking the rest of the container filesystem. Throws on escape or a
 * non-directory target.
 */
export async function listSandboxDirectory(
  sandbox: Sandbox,
  path: string,
): Promise<SandboxDirEntry[]> {
  // Resolve + confinement check happens in-sandbox (realpath) so symlinks
  // can't tunnel out either: we realpath the target and verify it's still
  // under the root before listing.
  const script =
    `set -e; ` +
    `root=$(realpath "${SANDBOX_DEFAULT_DIR}"); ` +
    `target=$(realpath "$1" 2>/dev/null) || { echo "__ENOENT__" >&2; exit 3; }; ` +
    `case "$target" in "$root"|"$root"/*) ;; *) echo "__ESCAPE__" >&2; exit 4;; esac; ` +
    `[ -d "$target" ] || { echo "__ENOTDIR__" >&2; exit 5; }; ` +
    `find "$target" -maxdepth 1 -mindepth 1 -printf '%y\\t%s\\t%f\\n'`;
  const result = await sandbox.runCommand({
    cmd: "bash",
    args: ["-c", script, "bash", path],
  });
  if (result.exitCode !== 0) {
    const stderr = (await result.stderr()).trim();
    if (stderr.includes("__ESCAPE__")) throw new Error("Path is outside the sandbox workspace");
    if (stderr.includes("__ENOENT__")) throw new Error("Path does not exist");
    if (stderr.includes("__ENOTDIR__")) throw new Error("Path is not a directory");
    throw new Error(`Failed to list directory (exit ${result.exitCode}): ${stderr.slice(0, 500)}`);
  }
  const stdout = await result.stdout();
  const entries: SandboxDirEntry[] = [];
  for (const line of stdout.split("\n")) {
    if (!line) continue;
    const [typeChar, sizeStr, ...nameParts] = line.split("\t");
    const name = nameParts.join("\t");
    if (!name) continue;
    const kind = kindFromTypeChar(typeChar);
    entries.push({
      name,
      kind,
      size: kind === "file" ? Number(sizeStr) || 0 : null,
    });
  }
  entries.sort((a, b) => {
    const aDir = a.kind === "directory" ? 0 : 1;
    const bDir = b.kind === "directory" ? 0 : 1;
    if (aDir !== bDir) return aDir - bDir;
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
  return entries;
}
