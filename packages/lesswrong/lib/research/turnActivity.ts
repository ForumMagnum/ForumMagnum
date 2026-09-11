/**
 * Shared definition of which research-conversation events mean "a turn is in
 * progress". Three derivations must agree on this and have already diverged
 * once (on the `error` kind), so they all draw from here:
 *
 *  - the supervisor's in-memory busy state (`conversationHub`)
 *  - the client/transcript `isTurnInFlight` (`conversationEventFormat`)
 *  - the dangling-turn SQL check (`ResearchConversationEventsRepo.hasIncompleteTurn`)
 *
 * This module must stay dependency-free: the supervisor bundle imports it by
 * relative path (no `@/` alias in its esbuild config), and it's also imported
 * from client code.
 *
 * `error` is deliberately NOT activity: an in-turn error is always preceded by
 * the turn's `system:init` (and usually a user event), so counting it adds
 * nothing — while an error line arriving *outside* a turn would otherwise wedge
 * the conversation as busy forever, since no `result` follows it.
 */
export const TURN_ACTIVITY_EVENT_KINDS = [
  "user",
  "assistant",
  "thinking",
  "tool_use",
  "tool_result",
] as const;

/** Every turn — dispatched, queued, or background-task re-invocation — opens
 * with a `system` line of this subtype. */
export const TURN_OPENING_SYSTEM_SUBTYPE = "init";

/**
 * Supervisor-synthesized `result` lines carry this subtype. Unlike a normal
 * per-turn result, they mean "everything outstanding was closed" (crash,
 * cancel flush, sandbox restart), so in-flight derivations treat them as
 * answering any user turn that never got to start.
 */
export const FLUSH_RESULT_SUBTYPE = "interrupted";

export function isTurnActivity(kind: string, systemSubtype: string | null | undefined): boolean {
  if (kind === "system") return systemSubtype === TURN_OPENING_SYSTEM_SUBTYPE;
  return (TURN_ACTIVITY_EVENT_KINDS as readonly string[]).includes(kind);
}
