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
import { repoScopeOf, type RepoIdentity } from "../repoUrl";
import { fetchRepoFile } from "../githubApi";
import { decryptUserSecret } from "../userSecretsCrypto";
import { resolveUserSecret } from "../userSecretAccess";
import { REPO_DIR, computeManifestHash, repoCommandCwd } from "./buildRepoInstallSnapshot";
import { runSandboxCommandOrThrow } from "./sandboxCommands";
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
 * Exact lockfile match → that snapshot (a hit). Otherwise the repo's most
 * recent snapshot (a miss): the repo and a warm package cache are already
 * there, so first provision reconciles only the dependency delta.
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
    const hit = await RepoInstallSnapshots.findOne({
      workspaceRepoId: workspaceRepo._id,
      manifestHash,
    });
    if (hit) return { snapshotId: hit.vercelSnapshotId, token, isStale: false };
  }

  // Miss (or the lockfile could not be fetched): fall back to the newest
  // snapshot. `createWorkspaceRepo` always writes one, so this is non-null.
  const mostRecent = await RepoInstallSnapshots.findOne(
    { workspaceRepoId: workspaceRepo._id },
    { sort: { createdAt: -1 } },
  );
  if (!mostRecent) {
    throw new Error(
      `Workspace repo ${workspaceRepo._id} has no install-cache snapshot — it cannot be provisioned.`,
    );
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
  const repo = repoIdentityOf(workspaceRepo);
  const cleanUrl = `https://${repo.host}/${repo.owner}/${repo.name}.git`;
  const cwd = repoCommandCwd(workspaceRepo.lockfilePath);

  // Advance the (shallow) clone to defaultBranch HEAD. With a token, point the
  // remote at an authed URL just for the fetch, then scrub it back so the token
  // is never written into the auto-snapshotted `.git/config`.
  if (token) {
    const authedUrl =
      `https://${encodeURIComponent(token)}@${repo.host}/${repo.owner}/${repo.name}.git`;
    await runSandboxCommandOrThrow(
      sandbox,
      { cmd: "git", args: ["-C", REPO_DIR, "remote", "set-url", "origin", authedUrl] },
      "git remote set-url (authed)",
    );
  }
  let fetchError: unknown = null;
  try {
    await runSandboxCommandOrThrow(
      sandbox,
      { cmd: "git", args: ["-C", REPO_DIR, "fetch", "--depth", "1", "origin", workspaceRepo.defaultBranch] },
      "git fetch",
    );
    await runSandboxCommandOrThrow(
      sandbox,
      { cmd: "git", args: ["-C", REPO_DIR, "reset", "--hard", "FETCH_HEAD"] },
      "git reset",
    );
  } catch (err) {
    fetchError = err;
  }

  // Scrub the token back out of `.git/config` before it can be baked into an
  // auto-snapshot. On the success path a failed scrub is itself fatal — the
  // token must not be left in the snapshot. On the failure path it is
  // best-effort, so a scrub error does not mask the real fetch failure.
  if (token) {
    const scrub = runSandboxCommandOrThrow(
      sandbox,
      { cmd: "git", args: ["-C", REPO_DIR, "remote", "set-url", "origin", cleanUrl] },
      "git remote set-url (scrub)",
    );
    if (fetchError) {
      await scrub.catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.warn(`[sandbox] failed to scrub git remote token: ${(err as Error).message}`);
      });
    } else {
      await scrub;
    }
  }
  if (fetchError) throw fetchError;

  if (isStale) {
    await runSandboxCommandOrThrow(
      sandbox,
      { cmd: "sh", args: ["-c", workspaceRepo.installCommand], cwd },
      "installCommand",
    );
  }
  if (workspaceRepo.prepareCommand) {
    await runSandboxCommandOrThrow(
      sandbox,
      { cmd: "sh", args: ["-c", workspaceRepo.prepareCommand], cwd },
      "prepareCommand",
    );
  }
}
