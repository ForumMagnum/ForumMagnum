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
import { Sandbox, APIError } from "@vercel/sandbox";
import { randomId } from "@/lib/random";
import type { RepoIdentity } from "@/lib/research/repoUrl";
import { fetchRepoFile } from "../githubApi";
import { runSandboxCommandOrThrow } from "./sandboxCommands";
import {
  REPO_DIR,
  computeManifestHash,
  repoBranchSyncTargetOf,
  runRepoInstallCommand,
  syncRepoToDefaultBranchHead,
} from "./repoSandboxSync";
import { isPostgresUniqueViolation } from "@/server/utils/postgresErrors";

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

  const cloneUrl = token
    ? `https://${encodeURIComponent(token)}@${repo.host}/${repo.owner}/${repo.name}.git`
    : `https://${repo.host}/${repo.owner}/${repo.name}.git`;

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
    await runRepoInstallCommand(sandbox, installCommand, lockfilePath);

    return await snapshotInstallCacheBuilder(sandbox, manifestHash);
  } catch (err) {
    await sandbox.stop().catch(() => { /* best effort — builder VM is throwaway */ });
    throw err;
  }
}

/**
 * Warm cache refresh when the lockfile has drifted: start from the repo's most
 * recent install snapshot, reconcile to HEAD + run `installCommand`, snapshot,
 * and return ids for a new `RepoInstallSnapshots` row (§3.5).
 */
export async function refreshRepoInstallCache(args: {
  workspaceRepo: Pick<
    DbWorkspaceRepo,
    "host" | "owner" | "name" | "defaultBranch" | "lockfilePath" | "installCommand"
  >;
  manifestHash: string;
  fromSnapshotId: string;
  token: string | null;
}): Promise<RepoInstallSnapshotResult> {
  const { workspaceRepo, manifestHash, fromSnapshotId, token } = args;
  if (workspaceRepo.host !== "github.com") {
    throw new Error(`Only github.com repositories are supported (got ${workspaceRepo.host}).`);
  }

  const sandbox = await Sandbox.create({
    source: { type: "snapshot", snapshotId: fromSnapshotId },
    timeout: BUILD_TIMEOUT_MS,
    resources: { vcpus: 2 },
    persistent: false,
  });
  try {
    await syncRepoToDefaultBranchHead(
      sandbox,
      repoBranchSyncTargetOf(workspaceRepo),
      token,
    );
    await runRepoInstallCommand(
      sandbox,
      workspaceRepo.installCommand,
      workspaceRepo.lockfilePath,
    );
    return await snapshotInstallCacheBuilder(sandbox, manifestHash);
  } catch (err) {
    await sandbox.stop().catch(() => { /* best effort — builder VM is throwaway */ });
    throw err;
  }
}

/**
 * Re-throw a Vercel SDK error with its HTTP status and response body attached.
 * `APIError.message` is only the generic "Status code N is not ok" — the real
 * reason (a quota code, a validation message) lives in `.json`/`.text`, which
 * is otherwise discarded once the error is wrapped in a GraphQLError on the way
 * back to the client. Non-`APIError`s are re-thrown unchanged.
 */
function rethrowWithApiErrorDetail(err: unknown, action: string): never {
  if (err instanceof APIError) {
    const body =
      err.json !== undefined ? JSON.stringify(err.json) : err.text ?? "(no response body)";
    throw new Error(`${action} failed: HTTP ${err.response.status} — ${body}`, { cause: err });
  }
  throw err;
}

async function snapshotInstallCacheBuilder(
  sandbox: Sandbox,
  manifestHash: string,
): Promise<RepoInstallSnapshotResult> {
  // `expiration: 0` — never expire. The install cache is the durable foundation
  // a configured repo provisions from. `snapshot()` stops the builder VM.
  try {
    const snapshot = await sandbox.snapshot({ expiration: 0 });
    return {
      vercelSnapshotId: snapshot.snapshotId,
      manifestHash,
      sizeBytes: snapshot.sizeBytes,
    };
  } catch (err) {
    rethrowWithApiErrorDetail(err, "Repo install-cache snapshot");
  }
}

/**
 * Insert a cache row, or return the existing row if another request won the race.
 */
export async function persistRepoInstallSnapshot(
  context: ResolverContext,
  workspaceRepoId: string,
  built: RepoInstallSnapshotResult,
): Promise<DbRepoInstallSnapshot> {
  const { RepoInstallSnapshots } = context;
  try {
    await RepoInstallSnapshots.rawInsert({
      _id: randomId(),
      createdAt: new Date(),
      workspaceRepoId,
      manifestHash: built.manifestHash,
      vercelSnapshotId: built.vercelSnapshotId,
      sizeBytes: built.sizeBytes,
    });
  } catch (err) {
    if (!isPostgresUniqueViolation(err)) throw err;
  }

  const row = await RepoInstallSnapshots.findOne(
    { workspaceRepoId, manifestHash: built.manifestHash },
    { sort: { createdAt: -1 } },
  );
  if (!row) {
    throw new Error(
      `RepoInstallSnapshots row missing after persist for workspace repo ${workspaceRepoId}`,
    );
  }
  return row;
}
