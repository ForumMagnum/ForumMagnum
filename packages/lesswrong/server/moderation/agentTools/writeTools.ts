import { z } from "zod";
import { proposalStepsSchema, validateProposalSteps, ModerationProposalStep } from "@/lib/collections/moderationProposals/proposalSteps";
import { createModerationProposal, updateModerationProposal } from "@/server/collections/moderationProposals/mutations";
import { createModerationSummary } from "@/server/collections/moderationSummaries/mutations";
import { updateUser } from "@/server/collections/users/mutations";
import { getSignatureWithNote } from "@/lib/collections/users/helpers";
import { supermodAgentModels } from "@/lib/collections/moderationAgentConversations/agentModels";
import { updateModerationLoreDoc } from "@/server/collections/moderationLoreDocs/mutations";
import { markdownToHtml } from "@/server/editor/conversionUtils";
import { defineModerationAgentTool, requireModeratorAccess } from "./types";

// Stops the model (by accident or prompt injection) from filing steps against someone else's content
async function assertStepDocumentsBelongToUser(
  steps: ModerationProposalStep[],
  targetUserId: string,
  context: ResolverContext,
) {
  for (const step of steps) {
    if (!("documentId" in step)) continue;
    const document = step.collectionName === "Posts"
      ? await context.Posts.findOne({ _id: step.documentId })
      : await context.Comments.findOne({ _id: step.documentId });
    if (!document) {
      throw new Error(`Document ${step.documentId} (${step.collectionName}) not found`);
    }
    if (document.userId !== targetUserId) {
      throw new Error(`Document ${step.documentId} does not belong to user ${targetUserId}`);
    }
  }
}

export const fileModerationProposalTool = defineModerationAgentTool({
  name: "file_moderation_proposal",
  description: "File a moderation action plan for the target user as a proposal. The proposal is queued for the moderator to review and apply — nothing executes until a human applies it. Only call this once the moderator has agreed on a plan in the conversation. Returns the proposalId.",
  inputSchema: z.object({
    targetUserId: z.string().optional().describe("The user the plan applies to; defaults to the user this conversation is about"),
    title: z.string().max(200).describe("Short title for the plan, e.g. 'Reject spam post and ban'"),
    rationale: z.string().describe("Why these actions are appropriate. Usually one or two sentences — the key evidence and the recommended action, with a rough confidence (e.g. \"~85%\"). Complex cases (permission restrictions, drafted DMs, users with long histories) often warrant more."),
    steps: proposalStepsSchema,
  }),
  readOnly: false,
  execute: async ({ targetUserId, title, rationale, steps }, context, bindings) => {
    const currentUser = requireModeratorAccess(context);
    const resolvedTargetUserId = targetUserId ?? bindings.defaultTargetUserId;
    if (!resolvedTargetUserId) {
      throw new Error("No target user: provide targetUserId");
    }
    const targetUser = await context.Users.findOne({ _id: resolvedTargetUserId });
    if (!targetUser) {
      throw new Error(`Target user ${resolvedTargetUserId} not found`);
    }
    const stepValidation = validateProposalSteps(steps);
    if (!stepValidation.valid) {
      throw new Error(stepValidation.error);
    }
    await assertStepDocumentsBelongToUser(stepValidation.steps, resolvedTargetUserId, context);

    const proposal = await createModerationProposal({
      data: {
        targetUserId: resolvedTargetUserId,
        createdByUserId: currentUser._id,
        conversationId: bindings.conversationId ?? null,
        title,
        rationale,
        steps: stepValidation.steps,
        status: "pending",
        model: bindings.model ?? null,
      },
    }, context);

    return JSON.stringify({ proposalId: proposal._id, status: proposal.status });
  },
});

export const updateModerationProposalTool = defineModerationAgentTool({
  name: "update_moderation_proposal",
  description: "Revise a proposal you filed earlier in this conversation (only while it is still pending review). Provide the full replacement steps array, not a delta.",
  inputSchema: z.object({
    proposalId: z.string(),
    title: z.string().max(200).optional(),
    rationale: z.string().optional().describe("Same shape as in file_moderation_proposal."),
    steps: proposalStepsSchema.optional(),
  }),
  readOnly: false,
  execute: async ({ proposalId, title, rationale, steps }, context) => {
    const currentUser = requireModeratorAccess(context);
    const proposal = await context.ModerationProposals.findOne({ _id: proposalId });
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }
    if (proposal.createdByUserId !== currentUser._id) {
      throw new Error("You can only revise proposals created in your own sessions");
    }
    if (proposal.status !== "draft" && proposal.status !== "pending") {
      throw new Error(`Cannot revise a proposal with status "${proposal.status}"`);
    }
    if (steps) {
      const stepValidation = validateProposalSteps(steps);
      if (!stepValidation.valid) {
        throw new Error(stepValidation.error);
      }
      await assertStepDocumentsBelongToUser(stepValidation.steps, proposal.targetUserId, context);
    }

    const updated = await updateModerationProposal({
      selector: { _id: proposalId },
      data: {
        ...(title !== undefined && { title }),
        ...(rationale !== undefined && { rationale }),
        ...(steps !== undefined && { steps }),
      },
    }, context);

    return JSON.stringify({ proposalId: updated._id, status: updated.status });
  },
});

export const saveUserSummaryTool = defineModerationAgentTool({
  name: "save_user_summary",
  description: "Persist a moderation summary of the target user (their history, behavior patterns, and moderation-relevant context) so future sessions and other moderators can see it. Saves a new version; older versions are kept.",
  inputSchema: z.object({
    targetUserId: z.string().optional().describe("Defaults to the user this conversation is about"),
    summaryMarkdown: z.string().describe("The summary, in markdown"),
  }),
  readOnly: false,
  execute: async ({ targetUserId, summaryMarkdown }, context, bindings) => {
    const currentUser = requireModeratorAccess(context);
    const resolvedTargetUserId = targetUserId ?? bindings.defaultTargetUserId;
    if (!resolvedTargetUserId) {
      throw new Error("No target user: provide targetUserId");
    }
    const summary = await createModerationSummary({
      data: {
        kind: "userSummary",
        targetUserId: resolvedTargetUserId,
        contents: summaryMarkdown,
        createdByUserId: currentUser._id,
        conversationId: bindings.conversationId ?? null,
        model: bindings.model ?? null,
      },
    }, context);
    return JSON.stringify({ summaryId: summary._id });
  },
});

export const saveUserGroupingTool = defineModerationAgentTool({
  name: "save_user_grouping",
  description: "Persist a grouping of similar users (e.g. suspected coordinated accounts, users sharing a behavior pattern) with a description of what connects them.",
  inputSchema: z.object({
    title: z.string().max(200).describe("Name for the grouping"),
    memberUserIds: z.array(z.string()).min(2).max(100),
    description: z.string().describe("Markdown description of what connects these users and the supporting evidence"),
  }),
  readOnly: false,
  execute: async ({ title, memberUserIds, description }, context, bindings) => {
    const currentUser = requireModeratorAccess(context);
    const members = await context.Users.find(
      { _id: { $in: memberUserIds } },
      {},
      { _id: 1 }
    ).fetch();
    const foundIds = new Set(members.map((member) => member._id));
    const missing = memberUserIds.filter((id) => !foundIds.has(id));
    if (missing.length) {
      throw new Error(`Unknown user ids: ${missing.join(", ")}`);
    }
    const grouping = await createModerationSummary({
      data: {
        kind: "userGrouping",
        memberUserIds,
        title,
        contents: description,
        createdByUserId: currentUser._id,
        conversationId: bindings.conversationId ?? null,
        model: bindings.model ?? null,
      },
    }, context);
    return JSON.stringify({ groupingId: grouping._id });
  },
});

export const appendLlmNoteTool = defineModerationAgentTool({
  name: "append_llm_note",
  description: "Add a note to the target user's LLM Notes: a shared moderation-notes field for LLM-authored observations, shown to all moderators alongside the human-written moderator notes. Use it to record durable, moderation-relevant observations about the user (patterns, context, outcomes) that future sessions and moderators should see. Keep notes short and factual.",
  inputSchema: z.object({
    targetUserId: z.string().optional().describe("Defaults to the user this conversation is about"),
    note: z.string().max(2000).describe("The note text (plain text, one entry)"),
  }),
  readOnly: false,
  execute: async ({ targetUserId, note }, context, bindings) => {
    requireModeratorAccess(context);
    const resolvedTargetUserId = targetUserId ?? bindings.defaultTargetUserId;
    if (!resolvedTargetUserId) {
      throw new Error("No target user: provide targetUserId");
    }
    const targetUser = await context.Users.findOne({ _id: resolvedTargetUserId });
    if (!targetUser) {
      throw new Error(`Target user ${resolvedTargetUserId} not found`);
    }
    const modelLabel = supermodAgentModels.find((option) => option.id === bindings.model)?.label ?? "LLM";
    const newNotes = getSignatureWithNote(`Agent (${modelLabel})`, note) + (targetUser.llmNotes ?? "");
    await updateUser({
      selector: { _id: resolvedTargetUserId },
      data: { llmNotes: newNotes },
    }, context);
    return JSON.stringify({ success: true });
  },
});

export const editLoreDocumentTool = defineModerationAgentTool({
  name: "edit_lore_document",
  description: "Edit or append to a moderation lore document. Lore is human-authored guidance: ONLY use this tool when the moderator explicitly asks you to update lore, and confirm the wording with them first. Edits create a new revision attributed to the moderator's session.",
  inputSchema: z.object({
    loreDocId: z.string().describe("_id of the lore document (from get_lore)"),
    mode: z.enum(["append", "replace"]),
    markdown: z.string().describe("Content to append, or the full replacement content"),
  }),
  readOnly: false,
  execute: async ({ loreDocId, mode, markdown }, context) => {
    requireModeratorAccess(context);
    const loreDoc = await context.ModerationLoreDocs.findOne({ _id: loreDocId });
    if (!loreDoc || loreDoc.deleted) {
      throw new Error(`Lore document ${loreDocId} not found`);
    }
    const newContentHtml = await markdownToHtml(markdown);
    const html = mode === "append"
      ? `${loreDoc.contents?.html ?? ""}${newContentHtml}`
      : newContentHtml;

    const updated = await updateModerationLoreDoc({
      selector: { _id: loreDocId },
      data: {
        contents: {
          originalContents: {
            type: "ckEditorMarkup",
            data: html,
          },
        },
      },
    }, context);

    return JSON.stringify({ loreDocId: updated._id, mode });
  },
});

export const moderationWriteTools = [
  fileModerationProposalTool,
  updateModerationProposalTool,
  saveUserSummaryTool,
  saveUserGroupingTool,
  appendLlmNoteTool,
  editLoreDocumentTool,
];
