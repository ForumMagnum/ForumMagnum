import type { ForumTypeString } from "@/lib/instanceSettings";
import { captureException } from "@/lib/sentryWrapper";
import LlmRuns from "@/server/collections/llmRuns/collection";
import { commentReplyRunHandler } from "@/server/llmReplies/commentReplyRun";
import { createAdminContext } from "@/server/vulcan-lib/createContexts";
import { requestLlmRun } from "./requestLlmRun";

const MAX_LLM_RUN_ATTEMPTS = 3;
/** Longer than the run route's maxDuration, so a claim this old means its attempt died */
const LLM_RUN_ATTEMPT_TIMEOUT_MS = 15 * 60 * 1000;
const LLM_RUN_PENDING_RETRY_AFTER_MS = 2 * 60 * 1000;

export interface LlmRunHandler {
  run: (run: DbLlmRun, forumType: ForumTypeString) => Promise<void>;
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
  if (!run) {
    return;
  }

  try {
    await getLlmRunHandler(run.invocationContext).run(run, forumType);
    await LlmRuns.rawUpdateOne({ _id: run._id }, { $set: { status: "completed", completedAt: new Date() } });
  } catch (err) {
    captureException(err);
    const error = err instanceof Error ? err.message : String(err);
    if (run.attemptCount < MAX_LLM_RUN_ATTEMPTS) {
      await LlmRuns.rawUpdateOne({ _id: run._id }, { $set: { status: "pending", error } });
      await requestLlmRun(run._id, forumType);
    } else {
      await failLlmRun(run, error, forumType);
    }
  }
}

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
