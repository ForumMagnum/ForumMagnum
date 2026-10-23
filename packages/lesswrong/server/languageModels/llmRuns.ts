import type { ForumTypeString } from "@/lib/instanceSettings";
import { captureException } from "@/lib/sentryWrapper";
import LlmRuns from "@/server/collections/llmRuns/collection";
import { commentReplyRunHandler } from "@/server/llmReplies/commentReplyRun";
import { createAdminContext } from "@/server/vulcan-lib/createContexts";
import { requestLlmRun } from "./requestLlmRun";

export const MAX_LLM_RUN_ATTEMPTS = 3;
/** Longer than the run route's maxDuration, so a claim this old means its attempt died */
const LLM_RUN_ATTEMPT_TIMEOUT_MS = 15 * 60 * 1000;
/** Pending runs older than this were never started, e.g. because the kickoff request failed */
const LLM_RUN_PENDING_RETRY_AFTER_MS = 2 * 60 * 1000;

/** What each feature that runs models in the background does with its runs */
export interface LlmRunHandler {
  /** Run the model and deliver its response; throws if the run failed */
  run: (run: DbLlmRun, forumType: ForumTypeString) => Promise<void>;
  /** Clean up after a failed run, e.g. tell the user it failed */
  fail: (run: DbLlmRun, forumType: ForumTypeString) => Promise<void>;
}

function getLlmRunHandler(invocationContext: LlmRunInvocationContext): LlmRunHandler {
  switch (invocationContext) {
    case "commentReply":
      return commentReplyRunHandler;
  }
}

export async function runLlmRun(runId: string, forumType: ForumTypeString): Promise<void> {
  const context = createAdminContext({ forumType });
  const run = await context.repos.llmRuns.claimRun(
    runId,
    new Date(Date.now() - LLM_RUN_ATTEMPT_TIMEOUT_MS),
    MAX_LLM_RUN_ATTEMPTS,
  );
  // Finished, out of attempts, or another attempt is working on it
  if (!run) {
    return;
  }

  try {
    await getLlmRunHandler(run.invocationContext).run(run, forumType);
    await LlmRuns.rawUpdateOne({ _id: run._id }, { $set: { status: "completed", completedAt: new Date() } });
  } catch (err) {
    captureException(err);
    await failLlmRun(run, err instanceof Error ? err.message : String(err), forumType);
  }
}

/** Restart runs whose attempts died or never started, and fail those out of attempts */
export async function retryStalledLlmRuns(forumType: ForumTypeString): Promise<void> {
  const context = createAdminContext({ forumType });
  const now = Date.now();
  const stalledRuns = await context.repos.llmRuns.getStalledRuns(
    new Date(now - LLM_RUN_PENDING_RETRY_AFTER_MS),
    new Date(now - LLM_RUN_ATTEMPT_TIMEOUT_MS),
  );
  for (const run of stalledRuns) {
    if (run.attemptCount >= MAX_LLM_RUN_ATTEMPTS) {
      await failLlmRun(run, `Gave up after ${run.attemptCount} attempts`, forumType);
    } else {
      await requestLlmRun(run._id, forumType);
    }
  }
}

async function failLlmRun(run: DbLlmRun, error: string, forumType: ForumTypeString): Promise<void> {
  await LlmRuns.rawUpdateOne({ _id: run._id }, { $set: { status: "failed", error, completedAt: new Date() } });
  await getLlmRunHandler(run.invocationContext).fail(run, forumType);
}
