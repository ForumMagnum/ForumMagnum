/* eslint-disable no-console */
import Users from "@/server/collections/users/collection";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { moderationReadTools } from "@/server/moderation/agentTools/readTools";
import { fileModerationProposalTool, saveUserSummaryTool } from "@/server/moderation/agentTools/writeTools";

export async function testSupermodAgentTools() {
  const admin = await Users.findOne({ isAdmin: true }, { sort: { createdAt: 1 } });
  if (!admin) throw new Error("No admin user found in dev db");
  const adminContext = await computeContextFromUser({ user: admin, isSSR: false });

  const target = await Users.findOne({ needsReview: true }, { sort: { createdAt: -1 } })
    ?? await Users.findOne({ banned: null, deleted: false }, { sort: { createdAt: -1 } });
  if (!target) throw new Error("No target user found in dev db");
  console.log(`Target user: ${target.displayName} (${target._id}); acting as admin ${admin.displayName}`);

  const bindings = { model: "test", defaultTargetUserId: target._id };

  // Tools that use runQuery with fragment spreads can't run under `yarn repl`, where tsconfig-repl
  // stubs out @/lib/generated/*; test those via the dev server.
  const replIncompatibleTools = new Set([
    "get_user_dossier", "get_user_content", "get_moderator_action_history",
    "list_moderation_templates", "list_review_queue",
  ]);

  for (const tool of moderationReadTools) {
    if (replIncompatibleTools.has(tool.name)) {
      console.log(`- ${tool.name}: skipped under repl (fragment-based; verify via dev server)`);
      continue;
    }
    const args: Record<string, unknown> = (() => {
      switch (tool.name) {
        case "find_alt_accounts": return { userId: target._id };
        case "get_moderation_summaries": return { userId: target._id };
        case "get_lore": return {};
        default: return {};
      }
    })();
    const result = await tool.execute(args, adminContext, bindings);
    console.log(`✓ ${tool.name}: ${result.length} chars, keys: ${Object.keys(JSON.parse(result)).join(",")}`);
  }

  const proposalResult = JSON.parse(await fileModerationProposalTool.execute({
    title: "Smoke test plan",
    rationale: "Testing only",
    steps: [{ action: "appendSunshineNote", note: "agent tool smoke test" }],
  }, adminContext, bindings));
  console.log(`✓ file_moderation_proposal: ${JSON.stringify(proposalResult)}`);

  const summaryResult = JSON.parse(await saveUserSummaryTool.execute({
    summaryMarkdown: "Smoke-test summary (safe to delete).",
  }, adminContext, bindings));
  console.log(`✓ save_user_summary: ${JSON.stringify(summaryResult)}`);

  await adminContext.ModerationProposals.rawUpdateOne({ _id: proposalResult.proposalId }, { $set: { status: "dismissed" } });
  await adminContext.ModerationSummaries.rawUpdateOne({ _id: summaryResult.summaryId }, { $set: { deleted: true } });
  console.log("✓ cleanup done");

  const nonMod = await Users.findOne({ isAdmin: false, groups: null, deleted: false });
  if (nonMod) {
    const nonModContext = await computeContextFromUser({ user: nonMod, isSSR: false });
    try {
      await moderationReadTools[0].execute({ userId: target._id }, nonModContext, bindings);
      throw new Error("FAIL: non-mod was allowed to use a moderation tool");
    } catch (error) {
      if (error instanceof Error && error.message.includes("Moderator access required")) {
        console.log("✓ non-mod context rejected");
      } else {
        throw error;
      }
    }
  } else {
    console.log("(no non-mod user found to test rejection)");
  }

  console.log("All tool smoke tests passed");
}
