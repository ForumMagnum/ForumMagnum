import { cheerioParse } from "@/server/utils/htmlUtil";
import { escapeHtml } from "@/lib/utils/sanitize";
import { isPlainRecord } from "@/components/research/conversationEventFormat";
import { LEADING_SYSTEM_REMINDER_REGEX } from "@/lib/research/systemReminderFormat";

/**
 * The system-reminder convention used by Claude Code (and Anthropic's other
 * agent surfaces): a `<system-reminder>` tag prepended to the user turn, with
 * attributes carrying structured context and a human-readable body. The model
 * is grounded (via Claude Code's default system prompt) to treat anything
 * inside this tag as system context, not as user input. We persist the
 * wrapped string verbatim — what we send to Claude is what we store — and
 * filter the tag out for display via `stripLeadingSystemReminder`.
 */

export interface DocumentContext {
  id: string;
  title: string;
}

interface SystemReminderInputs {
  activeDocument: DocumentContext;
  originDocument?: DocumentContext;
  conversationId?: string;
}

export function buildSystemReminderWrap(inputs: SystemReminderInputs, userPrompt: string): string {
  const { activeDocument, originDocument, conversationId } = inputs;
  const attrs = [`active-document-id="${escapeHtml(activeDocument.id)}"`];
  if (conversationId) {
    attrs.push(`conversation-id="${escapeHtml(conversationId)}"`);
  }
  if (originDocument && originDocument.id !== activeDocument.id) {
    attrs.push(`origin-document-id="${escapeHtml(originDocument.id)}"`);
  }
  const bodyLines = [
    `The user is currently viewing the research document "${activeDocument.title}" (id: ${activeDocument.id}) in the workspace.`,
  ];
  if (conversationId) {
    bodyLines.push(
      `This is research conversation ${conversationId}; references to that same conversation id are this conversation, not a separate prior conversation.`,
    );
  }
  if (originDocument && originDocument.id !== activeDocument.id) {
    bodyLines.push(
      `This conversation was originally invoked from "${originDocument.title}" (id: ${originDocument.id}).`,
    );
  }
  return `<system-reminder ${attrs.join(" ")}>\n${bodyLines.join("\n")}\n</system-reminder>\n\n${userPrompt}`;
}

export interface ParsedSystemReminder {
  activeDocumentId: string | null;
  originDocumentId: string | null;
  conversationId: string | null;
}

export function parseLeadingSystemReminder(text: string): ParsedSystemReminder | null {
  const match = text.match(LEADING_SYSTEM_REMINDER_REGEX);
  if (!match) return null;
  const $ = cheerioParse(match[0]);
  const el = $("system-reminder").first();
  if (!el.length) return null;
  return {
    activeDocumentId: el.attr("active-document-id") ?? null,
    originDocumentId: el.attr("origin-document-id") ?? null,
    conversationId: el.attr("conversation-id") ?? null,
  };
}

/**
 * Walk a conversation's persisted events in reverse seq order and return the
 * `active-document-id` from the most recently injected `<system-reminder>`
 * block on a user turn. Returns `null` if no prior turn carried one — i.e.
 * "never injected." Expects events in seq-ascending order (which matches
 * other consumers like `buildBootstrapJsonl`).
 */
export function deriveLastInjectedActiveDocumentId(
  events: DbResearchConversationEvent[],
): string | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event.kind !== "user") continue;
    const text = userEventText(event.payload);
    if (text === null) continue;
    const parsed = parseLeadingSystemReminder(text);
    if (parsed?.activeDocumentId) return parsed.activeDocumentId;
  }
  return null;
}

/**
 * Extract the user prompt text from a persisted user event. The event is now
 * Claude's stream-json shape — `{type:"user", message:{content}}` — where
 * `content` is either the string we fed via stdin or (the canonical message
 * shape Claude Code often normalizes to) an array of content blocks. Both are
 * handled, mirroring the display extractor in `conversationEventFormat.ts`, so
 * the leading `<system-reminder>` is found regardless of which form the replay
 * uses — otherwise the cadence check would re-inject a reminder every turn. The
 * legacy backend shape (`{type:"user", text}`) is still read as a fallback for
 * any pre-reconciliation rows.
 */
function userEventText(payload: unknown): string | null {
  if (!isPlainRecord(payload)) return null;
  const message = payload.message;
  if (isPlainRecord(message)) {
    const content = message.content;
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      const text = content
        .filter((part): part is Record<string, unknown> => isPlainRecord(part))
        .filter((part) => part.type === "text" && typeof part.text === "string")
        .map((part) => part.text as string)
        .join("");
      return text.length > 0 ? text : null;
    }
  }
  if (typeof payload.text === "string") return payload.text;
  return null;
}
