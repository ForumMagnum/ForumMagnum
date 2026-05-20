/**
 * Shared paths, lockfile hashing, and git + install steps for repo sandboxes
 * (throwaway cache builders and persistent conversation VMs).
 */
import * as path from "path";
import { createHash } from "crypto";
import type { Sandbox } from "@vercel/sandbox";
import type { RepoIdentity } from "@/lib/research/repoUrl";
import { runSandboxCommandOrThrow } from "./sandboxCommands";

/**
 * Absolute path the repository is cloned to inside every sandbox — the
 * throwaway builder and a coding conversation's persistent sandbox.
 */
export const REPO_DIR = "/vercel/sandbox/repo";

/** Working directory for install / prepare / dev: `dirname(lockfilePath)` under `REPO_DIR`. */
export function repoCommandCwd(lockfilePath: string): string {
  return path.posix.join(REPO_DIR, path.posix.dirname(lockfilePath));
}

/** SHA-256 (hex) of a lockfile's content — the `RepoInstallSnapshots` cache key. */
export function computeManifestHash(lockfileContent: string): string {
  return createHash("sha256").update(lockfileContent, "utf8").digest("hex");
}

export interface RepoBranchSyncTarget {
  host: string;
  owner: string;
  name: string;
  defaultBranch: string;
}

export function repoBranchSyncTargetOf(repo: RepoIdentity & { defaultBranch: string }): RepoBranchSyncTarget {
  return {
    host: repo.host,
    owner: repo.owner,
    name: repo.name,
    defaultBranch: repo.defaultBranch,
  };
}

function gitRemoteUrl(repo: RepoBranchSyncTarget, token: string | null): string {
  const cleanUrl = `https://${repo.host}/${repo.owner}/${repo.name}.git`;
  if (!token) return cleanUrl;
  return `https://${encodeURIComponent(token)}@${repo.host}/${repo.owner}/${repo.name}.git`;
}

/** Advance an existing clone to `defaultBranch` HEAD (shallow fetch + hard reset). */
export async function syncRepoToDefaultBranchHead(
  sandbox: Sandbox,
  repo: RepoBranchSyncTarget,
  token: string | null,
): Promise<void> {
  const remoteUrl = gitRemoteUrl(repo, token);
  await runSandboxCommandOrThrow(
    sandbox,
    { cmd: "git", args: ["-C", REPO_DIR, "remote", "set-url", "origin", remoteUrl] },
    "git remote set-url",
  );
  await runSandboxCommandOrThrow(
    sandbox,
    {
      cmd: "git",
      args: ["-C", REPO_DIR, "fetch", "--depth", "1", "origin", repo.defaultBranch],
    },
    "git fetch",
  );
  await runSandboxCommandOrThrow(
    sandbox,
    { cmd: "git", args: ["-C", REPO_DIR, "reset", "--hard", "FETCH_HEAD"] },
    "git reset",
  );
}

export async function runRepoInstallCommand(
  sandbox: Sandbox,
  installCommand: string,
  lockfilePath: string,
): Promise<void> {
  await runSandboxCommandOrThrow(
    sandbox,
    { cmd: "sh", args: ["-c", installCommand], cwd: repoCommandCwd(lockfilePath) },
    "installCommand",
  );
}
