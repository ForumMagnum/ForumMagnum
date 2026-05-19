/**
 * buildRepoInstallSnapshot — builds a repo's dependency-install cache snapshot.
 *
 * The cold dependency install is the slow part of bringing up a coding
 * workspace. It runs exactly once, here, when a repo is configured: a throwaway
 * sandbox is provisioned from the runtime baseline, the repo is cloned, its
 * `installCommand` is run, and the result is snapshotted. The snapshot id and
 * the lockfile's hash become a `RepoInstallSnapshots` row, so a conversation's
 * first turn never pays the cold install.
 *
 * No supervisor and no in-sandbox agent are involved — clone and install are
 * plain `runCommand`s against a builder VM that is discarded after the snapshot.
 */
import * as path from "path";
import { createHash } from "crypto";
import { Sandbox } from "@vercel/sandbox";
import type { RepoIdentity } from "../repoUrl";
import { fetchRepoFile } from "../githubApi";
import { runSandboxCommandOrThrow } from "./sandboxCommands";

/**
 * Absolute path the repository is cloned to inside every sandbox — the
 * throwaway builder here and, later, a coding conversation's persistent sandbox.
 */
export const REPO_DIR = "/vercel/sandbox/repo";

/**
 * Working directory for a repo's install / prepare / dev commands:
 * `dirname(lockfilePath)`, resolved against the clone root.
 */
export function repoCommandCwd(lockfilePath: string): string {
  return path.posix.join(REPO_DIR, path.posix.dirname(lockfilePath));
}

/** SHA-256 (hex) of a lockfile's content — the `RepoInstallSnapshots` cache key. */
export function computeManifestHash(lockfileContent: string): string {
  return createHash("sha256").update(lockfileContent, "utf8").digest("hex");
}

/** Generous ceiling for a cold dependency install on a large repo. */
const BUILD_TIMEOUT_MS = 15 * 60 * 1000;

export interface RepoInstallSnapshotResult {
  vercelSnapshotId: string;
  manifestHash: string;
  sizeBytes: number;
}

/**
 * Clone `repo` at `defaultBranch`, run `installCommand`, and snapshot the
 * result. The returned `manifestHash` is computed via the same code path a
 * conversation's provisioning uses, so a build can never produce a snapshot
 * keyed on a hash that would not match later.
 */
export async function buildRepoInstallSnapshot(args: {
  repo: RepoIdentity;
  defaultBranch: string;
  lockfilePath: string;
  installCommand: string;
  baselineSnapshotId: string;
  token: string | null;
}): Promise<RepoInstallSnapshotResult> {
  const { repo, defaultBranch, lockfilePath, installCommand, baselineSnapshotId, token } = args;
  if (repo.host !== "github.com") {
    throw new Error(`Only github.com repositories are supported (got ${repo.host}).`);
  }

  // Hash the lockfile (and fail before provisioning if it is missing).
  const lockfileContent = await fetchRepoFile(repo, lockfilePath, defaultBranch, token);
  if (lockfileContent === null) {
    throw new Error(
      `Lockfile not found at "${lockfilePath}" in ${repo.owner}/${repo.name}@${defaultBranch}`,
    );
  }
  const manifestHash = computeManifestHash(lockfileContent);

  const cleanRemoteUrl = `https://${repo.host}/${repo.owner}/${repo.name}.git`;
  const cloneUrl = token
    ? `https://${encodeURIComponent(token)}@${repo.host}/${repo.owner}/${repo.name}.git`
    : cleanRemoteUrl;

  const sandbox = await Sandbox.create({
    source: { type: "snapshot", snapshotId: baselineSnapshotId },
    timeout: BUILD_TIMEOUT_MS,
    resources: { vcpus: 2 },
    // Throwaway builder — we take an explicit snapshot and discard the VM.
    persistent: false,
  });
  try {
    await runSandboxCommandOrThrow(sandbox, {
      cmd: "git",
      args: ["clone", "--depth", "1", "--branch", defaultBranch, cloneUrl, REPO_DIR],
    }, "git clone");
    // Scrub the token from `.git/config` so it is never durably stored in the
    // snapshot; a conversation re-injects it when it needs to `git pull`.
    await runSandboxCommandOrThrow(sandbox, {
      cmd: "git",
      args: ["-C", REPO_DIR, "remote", "set-url", "origin", cleanRemoteUrl],
    }, "git remote set-url");
    await runSandboxCommandOrThrow(sandbox, {
      cmd: "sh",
      args: ["-c", installCommand],
      cwd: repoCommandCwd(lockfilePath),
    }, "installCommand");

    // `expiration: 0` — never expire. The install cache is the durable
    // foundation a configured repo provisions from; an expired snapshot would
    // strand the repo, and the rows that point at it are never deleted.
    // `snapshot()` stops the builder VM.
    const snapshot = await sandbox.snapshot({ expiration: 0 });
    return { vercelSnapshotId: snapshot.snapshotId, manifestHash, sizeBytes: snapshot.sizeBytes };
  } catch (err) {
    await sandbox.stop().catch(() => { /* best effort — builder VM is throwaway */ });
    throw err;
  }
}
