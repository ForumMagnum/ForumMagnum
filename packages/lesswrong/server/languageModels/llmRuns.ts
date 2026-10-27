import { captureException } from "@/lib/sentryWrapper";
import LlmRuns from "@/server/collections/llmRuns/collection";
import { failCommentReply, runCommentReply } from "@/server/llmReplies/commentReplyRun";
import { createAdminContext } from "@/server/vulcan-lib/createContexts";
import { requestLlmRun } from "./requestLlmRun";

const MAX_LLM_RUN_ATTEMPTS = 3;
/** Longer than the run route's maxDuration, so a claim this old means its attempt died */
const LLM_RUN_ATTEMPT_TIMEOUT_MS = 15 * 60 * 1000;
const LLM_RUN_PENDING_RETRY_AFTER_MS = 2 * 60 * 1000;
const LLM_RUN_GIVE_UP_AFTER_MS = 60 * 60 * 1000;

export async function runLlmRun(runId: string): Promise<void> {
  const context = createAdminContext({ forumType: "LessWrong" });
  const run = await context.repos.llmRuns.claimRun(
    runId,
    new Date(Date.now() - LLM_RUN_ATTEMPT_TIMEOUT_MS),
    MAX_LLM_RUN_ATTEMPTS,
  );
  if (!run) {
    return;
  }

  try {
    await runCommentReply(run);
    await LlmRuns.rawUpdateOne({ _id: run._id }, { $set: { status: "completed", completedAt: new Date() } });
  } catch (err) {
    captureException(err);
    const error = err instanceof Error ? err.message : String(err);
    if (run.attemptCount < MAX_LLM_RUN_ATTEMPTS) {
      await LlmRuns.rawUpdateOne({ _id: run._id }, { $set: { status: "pending", error } });
      await requestLlmRun(run._id);
    } else {
      await failLlmRun(run, error);
    }
  }
}

export async function retryStalledLlmRuns(): Promise<void> {
  const context = createAdminContext({ forumType: "LessWrong" });
  const now = Date.now();
  const stalledRuns = await context.LlmRuns.find({
    $or: [
      { status: "pending", createdAt: { $lt: new Date(now - LLM_RUN_PENDING_RETRY_AFTER_MS) } },
      { status: "running", claimedAt: { $lt: new Date(now - LLM_RUN_ATTEMPT_TIMEOUT_MS) } },
    ],
  }).fetch();
  for (const run of stalledRuns) {
    if (run.attemptCount >= MAX_LLM_RUN_ATTEMPTS || run.createdAt.getTime() < now - LLM_RUN_GIVE_UP_AFTER_MS) {
      await failLlmRun(run, `Gave up after ${run.attemptCount} attempts`);
    } else {
      await requestLlmRun(run._id);
    }
  }
}

async function failLlmRun(run: DbLlmRun, error: string): Promise<void> {
  await LlmRuns.rawUpdateOne({ _id: run._id }, { $set: { status: "failed", error, completedAt: new Date() } });
  await failCommentReply(run);
}
