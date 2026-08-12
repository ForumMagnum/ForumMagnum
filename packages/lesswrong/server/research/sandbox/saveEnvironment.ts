import { Sandbox, Snapshot } from "@vercel/sandbox";
import { signSupervisorToken } from "./supervisor/auth";
import {
  getRunningSandbox,
  sandboxNameForConversation,
  supervisorUrlForSandbox,
  SNAPSHOT_EXPIRATION_MS,
} from "./sandboxManager";

const QUIESCE_TIMEOUT_MS = 60_000;
const QUIESCE_POLL_MS = 1000;

const CLONE_TIMEOUT_MS = 10 * 60 * 1000;

export interface SavedEnvironmentSnapshot {
  vercelSnapshotId: string;
  sourceEventId: string | null;
  label: string;
}

interface SupervisorStatus {
  turnRunning: boolean;
  pendingEvents: number;
}

function signStatusBearer(sandboxName: string, conversationId: string, secret: string): string {
  return signSupervisorToken(
    { sandboxId: sandboxName, expiresAt: Date.now() + QUIESCE_TIMEOUT_MS + 30_000, scope: conversationId },
    secret,
  );
}

async function fetchSupervisorStatus(
  supervisorUrl: string,
  bearer: string,
): Promise<SupervisorStatus | null> {
  try {
    const res = await fetch(`${supervisorUrl}/status`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as Partial<SupervisorStatus>;
    return {
      turnRunning: !!body.turnRunning,
      pendingEvents: typeof body.pendingEvents === "number" ? body.pendingEvents : 0,
    };
  } catch {
    return null;
  }
}

async function quiesce(supervisorUrl: string, bearer: string): Promise<void> {
  const deadline = Date.now() + QUIESCE_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const status = await fetchSupervisorStatus(supervisorUrl, bearer);
    if (status) {
      if (status.turnRunning) {
        // `turnRunning` also covers pending background tasks: snapshotting
        // stops the sandbox, which would kill the task and the agent's
        // promised continuation.
        throw new Error("Can't save an environment while a turn or background task is running. Wait for it to finish.");
      }
      if (status.pendingEvents === 0) return;
    }
    await new Promise((r) => setTimeout(r, QUIESCE_POLL_MS));
  }
  throw new Error(
    "Can't save the environment until all events are delivered to the backend (the event queue did not drain in time).",
  );
}

async function detectRepoDirName(sandbox: Sandbox): Promise<string | null> {
  try {
    const res = await sandbox.runCommand({
      cmd: "sh",
      args: ["-c", "ls -1 /vercel/sandbox | grep -v '^init.sh$' | head -1"],
    });
    const name = (await res.stdout()).trim();
    return name.length > 0 ? name : null;
  } catch {
    return null;
  }
}

function deriveLabel(repoDir: string | null, conversationTitle: string | null): string {
  const base = repoDir ?? conversationTitle ?? "Environment";
  const date = new Date().toISOString().slice(0, 10);
  return `${base} · ${date}`;
}

async function scrubAgentSession(clone: Sandbox): Promise<void> {
  // `~/.claude/projects` is the session transcript; `~/.claude/history.jsonl` is
  // the global cross-conversation prompt log (outside projects/); `~/.claude.json`
  // may hold MRU prompt state. This removes only the agent session — it is NOT a
  // secrets scrub (the env keeps the user's functional setup, e.g. `.env`).
  await clone.runCommand({
    cmd: "sh",
    args: [
      "-c",
      "rm -rf ~/.claude/projects ~/.claude/history.jsonl; " +
        "[ -f ~/.claude.json ] && rm -f ~/.claude.json; true",
    ],
  });
}

async function createCloneFromSnapshot(snapshotId: string): Promise<Sandbox> {
  return Sandbox.create({
    source: { type: "snapshot", snapshotId },
    persistent: false,
    timeout: CLONE_TIMEOUT_MS,
    resources: { vcpus: 2 },
  });
}

export async function buildEnvironmentSnapshot(args: {
  conversationId: string;
  withConversation: boolean;
  conversationTitle: string | null;
  supervisorSecret: string;
  context: ResolverContext;
}): Promise<SavedEnvironmentSnapshot> {
  const { conversationId, withConversation, conversationTitle, supervisorSecret, context } = args;
  const sandboxName = sandboxNameForConversation(conversationId);

  const running = await getRunningSandbox(conversationId);

  if (running) {
    const bearer = signStatusBearer(sandboxName, conversationId, supervisorSecret);
    await quiesce(supervisorUrlForSandbox(running), bearer);
  }

  // Resolve the branch point AFTER the drain, so the latest `result` reflects
  // the same drained state the snapshot will capture — otherwise a result still
  // pending delivery at the start would leave the snapshot's on-disk session
  // ahead of the recorded branch seq, and a spawn would backfill only the stale
  // prefix while resuming the newer session. No completed turn ⇒ no session
  // worth branching, so treat it as "without".
  let sourceEventId: string | null = null;
  if (withConversation) {
    const latestResult = await context.ResearchConversationEvents.findOne(
      { conversationId, kind: "result" },
      { sort: { seq: -1 } },
    );
    sourceEventId = latestResult?._id ?? null;
  }
  const effectiveWith = withConversation && sourceEventId !== null;

  let clone: Sandbox | null = null;

  try {
    // The env snapshot is always taken from a throwaway clone, never from the
    // conversation's persistent sandbox: an env snapshot's lifecycle is the
    // environment's (deleted if the insert fails, deletable by the user), and
    // the persistent sandbox must never resume from a snapshot that can be
    // deleted out from under it.
    let cloneSourceSnapshotId: string;
    if (running) {
      // Stops the sandbox (cold resume next turn). This snapshot is what the
      // persistent sandbox resumes from, so it must outlive this function; it
      // gets the same retention as the sandbox's own auto-snapshots and is
      // superseded by the next one.
      const intermediate = await running.snapshot({ expiration: SNAPSHOT_EXPIRATION_MS });
      cloneSourceSnapshotId = intermediate.snapshotId;
    } else {
      cloneSourceSnapshotId = await Snapshot.fromSandbox(sandboxName);
    }
    clone = await createCloneFromSnapshot(cloneSourceSnapshotId);
    const repoDir = await detectRepoDirName(clone);
    if (!effectiveWith) {
      await scrubAgentSession(clone);
    }
    const snap = await clone.snapshot({ expiration: 0 });

    return {
      vercelSnapshotId: snap.snapshotId,
      sourceEventId: effectiveWith ? sourceEventId : null,
      label: deriveLabel(repoDir, conversationTitle),
    };
  } finally {
    if (clone) {
      await clone.stop().catch(() => {});
    }
  }
}
