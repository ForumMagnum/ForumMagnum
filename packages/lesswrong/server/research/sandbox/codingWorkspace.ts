/**
 * codingWorkspace — the coding-conversation half of sandbox provisioning.
 *
 * A coding conversation's sandbox is created from its repo's install-cache
 * snapshot (`RepoInstallSnapshots`) rather than a bare runtime baseline, so the
 * repo and its dependencies are already present. This module decides which
 * cache snapshot to use and runs the one-time first-provision setup (bring the
 * repo to HEAD, reconcile dependencies if needed, run `prepareCommand`).
 */
import type { Sandbox } from "@vercel/sandbox";
import { repoScopeOf, type RepoIdentity } from "@/lib/research/repoUrl";
import { fetchRepoFile } from "../githubApi";
import { decryptUserSecret } from "../userSecretsCrypto";
import { resolveUserSecret } from "../userSecretAccess";
import {
  persistRepoInstallSnapshot,
  refreshRepoInstallCache,
} from "./buildRepoInstallSnapshot";
import { runSandboxCommandOrThrow } from "./sandboxCommands";
import {
  computeManifestHash,
  repoBranchSyncTargetOf,
  repoCommandCwd,
  runRepoInstallCommand,
  syncRepoToDefaultBranchHead,
} from "./repoSandboxSync";
import { GITHUB_TOKEN_SECRET } from "@/lib/collections/userSecrets/userSecretNames";

function repoIdentityOf(repo: DbWorkspaceRepo): RepoIdentity {
  return { host: repo.host, owner: repo.owner, name: repo.name };
}

export interface CodingSnapshotPlan {
  /** Vercel snapshot the conversation's sandbox is created from. */
  snapshotId: string;
  /** The repo's GitHub token, or null for a public repo. */
  token: string | null;
  /**
   * True when no install-cache snapshot matched the repo HEAD's current
   * lockfile — first provision must run `installCommand` to reconcile the
   * dependency delta. False (a cache hit) needs no install.
   */
  isStale: boolean;
}

/**
 * Decide which install-cache snapshot a coding conversation provisions from.
 * Exact lockfile match → that snapshot (a hit). On miss, warm-refresh the
 * install cache synchronously (§3.5), then provision from the new snapshot.
 */
export async function resolveCodingSnapshot(
  context: ResolverContext,
  workspaceRepo: DbWorkspaceRepo,
): Promise<CodingSnapshotPlan> {
  const { RepoInstallSnapshots } = context;
  const repoScope = repoScopeOf(repoIdentityOf(workspaceRepo));
  const token = await resolveUserSecret(context, workspaceRepo.userId, repoScope, GITHUB_TOKEN_SECRET);

  const lockfile = await fetchRepoFile(
    repoIdentityOf(workspaceRepo),
    workspaceRepo.lockfilePath,
    workspaceRepo.defaultBranch,
    token,
  );
  const manifestHash = lockfile === null ? null : computeManifestHash(lockfile);

  if (manifestHash) {
    const hit = await RepoInstallSnapshots.findOne(
      { workspaceRepoId: workspaceRepo._id, manifestHash },
      { sort: { createdAt: -1 } },
    );
    if (hit) {
      return { snapshotId: hit.vercelSnapshotId, token, isStale: false };
    }
  }

  const mostRecent = await RepoInstallSnapshots.findOne(
    { workspaceRepoId: workspaceRepo._id },
    { sort: { createdAt: -1 } },
  );
  if (!mostRecent) {
    throw new Error(
      `Workspace repo ${workspaceRepo._id} has no install-cache snapshot — it cannot be provisioned.`,
    );
  }

  if (manifestHash) {
    try {
      const built = await refreshRepoInstallCache({
        workspaceRepo,
        manifestHash,
        fromSnapshotId: mostRecent.vercelSnapshotId,
        token,
      });
      const row = await persistRepoInstallSnapshot(context, workspaceRepo._id, built);
      return { snapshotId: row.vercelSnapshotId, token, isStale: false };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        `[sandbox] install-cache warm refresh failed for workspace repo ${workspaceRepo._id}, ` +
          `falling back to incremental install on the conversation sandbox: ` +
          `${(err as Error).message}`,
      );
    }
  }

  return { snapshotId: mostRecent.vercelSnapshotId, token, isStale: true };
}

/**
 * All of a repo's secrets, decrypted, as a plain env map — every repo-scoped
 * `UserSecrets` row for the conversation's owner. Injected into the dev
 * server's environment at supervisor launch (design §3.6).
 */
export async function collectRepoEnvSecrets(
  context: ResolverContext,
  userId: string,
  repoScope: string,
): Promise<Record<string, string>> {
  const rows = await context.UserSecrets.find(
    { userId, repoScope },
    {},
    { name: 1, encryptedValue: 1 },
  ).fetch();
  const out: Record<string, string> = {};
  for (const row of rows) {
    out[row.name] = decryptUserSecret(row.encryptedValue);
  }
  return out;
}

/**
 * First-provision setup for a coding conversation's sandbox: bring the repo to
 * its `defaultBranch` HEAD, reconcile dependencies if the install cache was
 * stale, and run `prepareCommand`. Runs once, in `onCreate`; a later resume
 * restores this state from the auto-snapshot and does not repeat it.
 */
export async function runCodingFirstProvision(
  sandbox: Sandbox,
  args: { workspaceRepo: DbWorkspaceRepo; token: string | null; isStale: boolean },
): Promise<void> {
  const { workspaceRepo, token, isStale } = args;
  const cwd = repoCommandCwd(workspaceRepo.lockfilePath);

  await syncRepoToDefaultBranchHead(
    sandbox,
    repoBranchSyncTargetOf(workspaceRepo),
    token,
  );

  if (isStale) {
    await runRepoInstallCommand(sandbox, workspaceRepo.installCommand, workspaceRepo.lockfilePath);
  }
  if (workspaceRepo.prepareCommand) {
    await runSandboxCommandOrThrow(
      sandbox,
      { cmd: "sh", args: ["-c", workspaceRepo.prepareCommand], cwd },
      "prepareCommand",
    );
  }
}
