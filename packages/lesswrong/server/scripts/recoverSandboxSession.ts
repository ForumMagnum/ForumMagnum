import { Sandbox } from "@vercel/sandbox";
import { randomId, randomSecret } from "@/lib/random";
import ResearchSandboxSessions from "@/server/collections/researchSandboxSessions/collection";
import { sandboxNameForConversation } from "@/server/research/sandbox/sandboxManager";

/**
 * One-off recovery for a conversation whose `ResearchSandboxSessions` row was
 * lost while its Vercel sandbox is still around. Without the row,
 * `getOrCreateSandbox` mints a fresh `supervisorSecret` on every dispatch, but
 * the supervisor inside the sandbox uses whatever secret it was launched with
 * — so signatures never match and every dispatch 401s with "bad signature".
 *
 * Two cases, handled here:
 *
 *   1. Sandbox is currently running. The original supervisor is alive with
 *      its original `SUPERVISOR_SECRET` in env. Read that out of
 *      `/proc/<pid>/environ` and pin it into a new row. The running supervisor
 *      is left undisturbed — the conversation can continue immediately.
 *
 *   2. Sandbox is stopped. The supervisor process is gone; its env is
 *      irrecoverable. But the auto-snapshot taken on idle-stop preserves the
 *      Claude Code session JSONL on disk, so the conversation's late events
 *      are safe. Generate a *fresh* secret and pin it into a new row. The
 *      next dispatch will resume the sandbox, fire `onResume` →
 *      `launchSupervisor` injecting that secret into the new session's env,
 *      so signing and validation will be in sync.
 *
 * Either way: no existing row for the conversation can be present, since
 * silently overwriting would mask a real row.
 *
 * Usage:
 *   yarn repl dev lw packages/lesswrong/server/scripts/recoverSandboxSession.ts
 *
 * Or to target a different conversation than the default-export's:
 *   yarn repl dev lw packages/lesswrong/server/scripts/recoverSandboxSession.ts \
 *     'recoverSandboxSession({ conversationId: "abc123" })'
 */

const DEFAULT_CONVERSATION_ID = "uZ3BcDymbDWMEmr8i";

export interface RecoverSandboxSessionArgs {
  conversationId: string;
}

async function probeSupervisorEnvVar(sandbox: Sandbox, varName: string): Promise<string | null> {
  const cmd = await sandbox.runCommand({
    cmd: "sh",
    args: [
      "-c",
      `cat /proc/$(pgrep -f supervisor.js | head -1)/environ 2>/dev/null | tr '\\0' '\\n' | grep '^${varName}=' | cut -d= -f2-`,
    ],
  });
  const value = (await cmd.stdout()).trim();
  return value.length > 0 ? value : null;
}

export async function recoverSandboxSession(args: RecoverSandboxSessionArgs): Promise<void> {
  const { conversationId } = args;
  if (!conversationId) {
    throw new Error("recoverSandboxSession: conversationId is required");
  }

  const existing = await ResearchSandboxSessions.findOne({ conversationId });
  if (existing) {
    throw new Error(
      `ResearchSandboxSessions row already exists for conversation ${conversationId} ` +
        `(supervisorSecret=${existing.supervisorSecret.slice(0, 8)}…). Refusing to overwrite. ` +
        `If you really want to re-recover, delete the row manually first.`,
    );
  }

  const name = sandboxNameForConversation(conversationId);
  // eslint-disable-next-line no-console
  console.log(`[recover] connecting to sandbox ${name}…`);
  // `resume: false` is critical for the running-case: resuming would start a
  // new session whose env we'd then set — and the new env would lack our
  // SUPERVISOR_SECRET (we set sandbox-level env to empty at create time),
  // so the new supervisor wouldn't even boot, and the secret we wanted to
  // recover would already be gone.
  const sandbox = await Sandbox.get({ name, resume: false });

  let supervisorSecret: string;
  let devProxySecret: string | null;

  if (sandbox.status === "running") {
    // eslint-disable-next-line no-console
    console.log(`[recover] sandbox is running; reading SUPERVISOR_SECRET from live supervisor process…`);
    const liveSecret = await probeSupervisorEnvVar(sandbox, "SUPERVISOR_SECRET");
    if (!liveSecret) {
      throw new Error(
        `Sandbox ${name} is running but SUPERVISOR_SECRET could not be read from any supervisor.js ` +
          `process. The supervisor may have crashed; check /vercel/sandbox/supervisor.log via inspectSandbox. ` +
          `If you want to proceed anyway with a fresh secret, stop the sandbox first so this script takes ` +
          `the stopped-case branch.`,
      );
    }
    supervisorSecret = liveSecret;
    devProxySecret = await probeSupervisorEnvVar(sandbox, "DEV_PROXY_SECRET");
    // eslint-disable-next-line no-console
    console.log(
      `[recover] recovered original SUPERVISOR_SECRET=${supervisorSecret.slice(0, 8)}… ` +
        `(length ${supervisorSecret.length})` +
        (devProxySecret ? `, DEV_PROXY_SECRET=${devProxySecret.slice(0, 8)}…` : ", no DEV_PROXY_SECRET"),
    );
  } else {
    // The supervisor's in-memory env is irrecoverable. Mint a fresh secret;
    // the next dispatch's `launchSupervisor` will inject it into the resumed
    // session, so both sides will sign/validate with the same value.
    // `devProxySecret` stays null — `getOrCreateSandbox` will backfill it on
    // the next dispatch if this turns out to be a coding sandbox with a
    // dev-server (the row-update at sandboxManager.ts:343 handles that case).
    supervisorSecret = randomSecret();
    devProxySecret = null;
    // eslint-disable-next-line no-console
    console.log(
      `[recover] sandbox is in status "${sandbox.status}"; supervisor env is gone. ` +
        `Minting a fresh SUPERVISOR_SECRET=${supervisorSecret.slice(0, 8)}…; the next dispatch will ` +
        `resume the sandbox and launch a supervisor under this secret.`,
    );
  }

  await ResearchSandboxSessions.rawInsert({
    _id: randomId(),
    conversationId,
    supervisorSecret,
    devProxySecret,
    createdAt: new Date(),
  });

  // eslint-disable-next-line no-console
  console.log(`[recover] inserted ResearchSandboxSessions row for conversation ${conversationId}.`);
}

export default () => recoverSandboxSession({ conversationId: DEFAULT_CONVERSATION_ID });
