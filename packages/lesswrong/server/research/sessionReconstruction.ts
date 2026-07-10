import { v5 as uuidv5 } from "uuid";
import { isPlainRecord } from "@/components/research/conversationEventFormat";

const SANDBOX_CWD = "/vercel/sandbox";

/** Fixed UUIDv5 namespace for deriving Claude session ids from conversation ids. */
const CLAUDE_SESSION_ID_NAMESPACE = "48734f38-9434-422d-b942-88b21da4fac2";

/**
 * The Claude session id a conversation owns, derived deterministically from
 * its id (the CLI requires a UUID; conversation ids are 17-char random
 * strings). Set on the conversation row at creation and passed on every
 * dispatch, so the supervisor never has to mint one and the backend never has
 * to capture one back out of the event stream. Conversations created before
 * this scheme keep their stored (captured) id; environment forks reuse the
 * source conversation's id when its session file is on the snapshot.
 */
export function claudeSessionIdForConversation(conversationId: string): string {
  return uuidv5(conversationId, CLAUDE_SESSION_ID_NAMESPACE);
}
const SESSION_JSONL_DROPPED_TYPES = new Set(["system", "result", "error"]);
const MAINLINE_GROUP_KEY = "__mainline__";

export function buildBootstrapJsonl(
  events: DbResearchConversationEvent[],
  claudeSessionId: string,
): string[] {
  // Track chain heads per group: mainline events under MAINLINE_GROUP_KEY, and
  // each sub-agent's events keyed by the parent Task's tool_use id. Without
  // this split, a sidechain event would chain to whatever mainline event
  // happened to come before it in seq order, breaking Claude Code's chain
  // walk when it follows `parentUuid` within a sub-agent.
  const chainHeads = new Map<string, string | null>();
  const lines: string[] = [];
  for (const event of events) {
    if (!isPlainRecord(event.payload)) continue;
    const groupKey = chainGroupOf(event.payload);
    const prevUuid = chainHeads.get(groupKey) ?? null;
    const result = toClaudeSessionLine(event, claudeSessionId, prevUuid);
    if (!result) continue;
    lines.push(JSON.stringify(result.line));
    chainHeads.set(groupKey, result.uuid);
  }
  return lines;
}

function chainGroupOf(payload: Record<string, unknown>): string {
  const ptu = payload.parent_tool_use_id;
  return typeof ptu === "string" ? ptu : MAINLINE_GROUP_KEY;
}

function toClaudeSessionLine(
  event: DbResearchConversationEvent,
  claudeSessionId: string,
  prevUuid: string | null,
): { line: unknown; uuid: string } | null {
  const payload = event.payload;
  if (!isPlainRecord(payload)) return null;
  const type = payload.type;
  if (typeof type !== "string") return null;
  if (SESSION_JSONL_DROPPED_TYPES.has(type)) return null;

  const timestamp = event.createdAt instanceof Date
    ? event.createdAt.toISOString()
    : String(event.createdAt);
  const isSidechain = typeof payload.parent_tool_use_id === "string";

  if ("message" in payload || typeof payload.uuid === "string") {
    const uuid = typeof payload.uuid === "string" ? payload.uuid : event._id;
    const { session_id: _droppedSessionId, uuid: _droppedUuid, ...rest } = payload;
    void _droppedSessionId;
    void _droppedUuid;
    return {
      line: {
        ...rest,
        uuid,
        parentUuid: prevUuid,
        isSidechain,
        timestamp,
        userType: "external",
        entrypoint: "cli",
        cwd: SANDBOX_CWD,
        sessionId: claudeSessionId,
      },
      uuid,
    };
  }

  return null;
}
