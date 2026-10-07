import { z } from "zod";

/**
 * The atomic moderation actions that a moderation agent may include in a
 * proposal. This is the single source of truth shared by the server (tool
 * input validation in `@/server/moderation/agentTools/`) and the client
 * (the apply executor in the supermod UI, which maps each step onto the
 * existing moderation mutations).
 *
 * Steps carry target values rather than toggles, so applying a step twice is
 * idempotent; the client records already-satisfied steps as skipped.
 */

const note = z.string().max(500).optional().describe("Short per-step rationale shown to the moderator");

const contentTarget = {
  documentId: z.string().describe("The _id of the post or comment"),
  collectionName: z.enum(["Posts", "Comments"]),
};

const approveUserStep = z.object({
  action: z.literal("approveUser"),
  note,
}).describe("Approve the user: mark them reviewed and remove them from the review queue");

const approveCurrentContentOnlyStep = z.object({
  action: z.literal("approveCurrentContentOnly"),
  note,
}).describe("Approve the user's existing content without fully approving the user; future content will still need review");

const snoozeStep = z.object({
  action: z.literal("snooze"),
  contentCount: z.number().int().min(1).max(100).describe("Number of additional content items after which the user returns to the review queue"),
  note,
}).describe("Snooze the user: remove from the queue until they post this many more items");

const removeFromQueueStep = z.object({
  action: z.literal("removeFromQueue"),
  note,
}).describe("Remove the user from the review queue without approving them");

const rejectContentAndRemoveFromQueueStep = z.object({
  action: z.literal("rejectContentAndRemoveFromQueue"),
  ...contentTarget,
  rejectedReason: z.string().describe("HTML rejection reason, usually built from rejection templates"),
  messageHtml: z.string().optional().describe("If provided, additionally restricts the user's posting/commenting/messaging/voting permissions and sends them this HTML message as a moderator DM (the restrict-and-notify flow)"),
  note,
}).describe("Reject a piece of content and remove its author from the review queue; optionally restrict the user and notify them by DM");

const rejectContentStep = z.object({
  action: z.literal("rejectContent"),
  ...contentTarget,
  rejectedReason: z.string().describe("HTML rejection reason, usually built from rejection templates"),
  note,
}).describe("Reject a specific post or comment (it becomes hidden from public listings and the author is notified)");

const unrejectContentStep = z.object({
  action: z.literal("unrejectContent"),
  ...contentTarget,
  note,
}).describe("Reverse a previous rejection of a specific post or comment");

const banUserStep = z.object({
  action: z.literal("banUser"),
  months: z.number().int().min(1).max(1200).describe("Ban duration in months from now"),
  note,
}).describe("Ban the user from the site for a duration");

const flagUserStep = z.object({
  action: z.literal("flagUser"),
  flagged: z.boolean(),
  note,
}).describe("Set or clear the sunshine flag on the user (marks them for closer attention by other moderators)");

const setContentPermissionStep = z.object({
  action: z.literal("setContentPermission"),
  permission: z.enum(["posting", "allCommenting", "conversations", "voting"]),
  disabled: z.boolean().describe("Target state: true disables the capability, false re-enables it"),
  note,
}).describe("Disable or re-enable one of the user's content permissions (posting, commenting, private messages, or voting)");

const setRateLimitStep = z.object({
  action: z.literal("setRateLimit"),
  type: z.enum(["allPosts", "allComments"]),
  intervalUnit: z.enum(["minutes", "hours", "days", "weeks"]),
  intervalLength: z.number().int().min(1),
  actionsPerInterval: z.number().int().min(1),
  endAfterDays: z.number().int().min(1).optional().describe("The rate limit expires this many days from now (default 21)"),
  note,
}).describe("Impose a posting or commenting rate limit on the user");

const sendModeratorMessageStep = z.object({
  action: z.literal("sendModeratorMessage"),
  subject: z.string().describe("Conversation title"),
  messageHtml: z.string().describe("HTML body of the message"),
  templateId: z.string().optional().describe("_id of the ModerationTemplate this message was based on, if any"),
  note,
}).describe("Send the user a private message from the moderation team");

const appendSunshineNoteStep = z.object({
  action: z.literal("appendSunshineNote"),
  note: z.string().max(2000).describe("The note text to prepend to the user's moderator notes, attributed to the applying moderator"),
}).describe("Add a note to the user's private moderator notes. Only include this step when the moderator explicitly asked for a note — never on your own initiative: every applied step already leaves its own signed note entry, so routine notes are redundant.");

export const proposalStepSchema = z.discriminatedUnion("action", [
  approveUserStep,
  approveCurrentContentOnlyStep,
  snoozeStep,
  removeFromQueueStep,
  rejectContentAndRemoveFromQueueStep,
  rejectContentStep,
  unrejectContentStep,
  banUserStep,
  flagUserStep,
  setContentPermissionStep,
  setRateLimitStep,
  sendModeratorMessageStep,
  appendSunshineNoteStep,
]);

export const proposalStepsSchema = z.array(proposalStepSchema).min(1).max(20);

export type ModerationProposalStep = z.infer<typeof proposalStepSchema>;
export type ModerationProposalStepAction = ModerationProposalStep["action"];

export const moderationProposalStatuses = ["draft", "pending", "applied", "partiallyApplied", "dismissed"] as const;
export type ModerationProposalStatus = typeof moderationProposalStatuses[number];

/**
 * Steps that end the user's presence in the review queue. A valid proposal
 * contains at most one of these, and it must come last when applied.
 */
export const queueTerminalActions: ModerationProposalStepAction[] = [
  "approveUser",
  "snooze",
  "removeFromQueue",
  "banUser",
  "rejectContentAndRemoveFromQueue",
];

export interface ModerationProposalStepResult {
  index: number;
  status: "applied" | "skipped" | "failed";
  error?: string;
}

/**
 * Parses raw JSONB steps from the database into typed steps. Returns null for
 * entries that fail validation, so callers can report per-step failures
 * instead of rejecting the whole proposal.
 */
export function parseProposalSteps(rawSteps: unknown): Array<ModerationProposalStep | null> {
  if (!Array.isArray(rawSteps)) {
    return [];
  }
  return rawSteps.map((rawStep) => {
    const parsed = proposalStepSchema.safeParse(rawStep);
    return parsed.success ? parsed.data : null;
  });
}

/**
 * Execution-order sort key, shared by the apply executor and the proposal
 * card's display so what the moderator reads matches what will run: content
 * actions first, then restrictions and side effects, then the (at most one)
 * queue-terminal step last.
 */
export function stepExecutionOrder(step: ModerationProposalStep): number {
  if (step.action === "rejectContent" || step.action === "unrejectContent") return 0;
  if (queueTerminalActions.includes(step.action)) return 2;
  return 1;
}

/**
 * Terse human-readable lines for what applying a step will do, in the order
 * the effects happen. Composite actions decompose into their semantic parts
 * (e.g. reject-and-remove is a rejection plus a dequeue). Pass contentTitle
 * to name the targeted post/comment.
 */
export function describeProposalStepParts(step: ModerationProposalStep, contentTitle?: string): string[] {
  const contentName = contentTitle
    ? `"${contentTitle}"`
    : "collectionName" in step ? (step.collectionName === "Posts" ? "post" : "comment") : "";
  switch (step.action) {
    case "approveUser":
      return ["Approve user", "Remove user from queue"];
    case "approveCurrentContentOnly":
      return ["Approve current content only"];
    case "snooze":
      return ["Remove user from queue", `Re-review after ${step.contentCount} more posts/comments`];
    case "removeFromQueue":
      return ["Remove user from queue"];
    case "rejectContentAndRemoveFromQueue":
      return [
        `Reject ${contentName}`,
        ...(step.messageHtml ? [
          "Restrict posting, commenting, messaging, and voting",
          "Send moderator message",
        ] : []),
        "Remove user from queue",
      ];
    case "rejectContent":
      return [`Reject ${contentName}`];
    case "unrejectContent":
      return [`Un-reject ${contentName}`];
    case "banUser":
      return [`Ban for ${step.months} month${step.months === 1 ? "" : "s"}`, "Remove user from queue"];
    case "flagUser":
      return [step.flagged ? "Flag user" : "Unflag user"];
    case "setContentPermission": {
      const permissionPhrases = {
        posting: "posting",
        allCommenting: "commenting",
        conversations: "messaging",
        voting: "voting",
      } as const;
      return [`${step.disabled ? "Disable" : "Re-enable"} ${permissionPhrases[step.permission]}`];
    }
    case "setRateLimit":
      return [`Rate limit: ${step.actionsPerInterval} ${step.type === "allPosts" ? "post" : "comment"}${step.actionsPerInterval === 1 ? "" : "s"} per ${step.intervalLength} ${step.intervalLength === 1 ? step.intervalUnit.slice(0, -1) : step.intervalUnit}, for ${step.endAfterDays ?? 21} days`];
    case "sendModeratorMessage":
      return [`Send moderator message: "${step.subject}"`];
    case "appendSunshineNote":
      return ["Add moderator note"];
  }
}

export function validateProposalSteps(rawSteps: unknown): { valid: true; steps: ModerationProposalStep[] } | { valid: false; error: string } {
  const parsed = proposalStepsSchema.safeParse(rawSteps);
  if (!parsed.success) {
    return { valid: false, error: parsed.error.message };
  }
  const terminalCount = parsed.data.filter((step) => queueTerminalActions.includes(step.action)).length;
  if (terminalCount > 1) {
    return { valid: false, error: "A proposal may contain at most one queue-terminal step (approveUser, snooze, removeFromQueue, banUser, or rejectContentAndRemoveFromQueue)" };
  }
  return { valid: true, steps: parsed.data };
}
