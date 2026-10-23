import { siteUrlSetting, type ForumTypeString } from "@/lib/instanceSettings";
import { combineUrls } from "@/lib/vulcan-lib/utils";

export const LLM_RUN_ROUTE = "/api/llmRuns/run";

/**
 * Start a run in its own request, so it gets that route's longer time limit
 * instead of sharing the limit of the request that created it. The route
 * responds as soon as the run has started.
 */
export async function requestLlmRun(runId: string, forumType: ForumTypeString): Promise<void> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    throw new Error("CRON_SECRET must be set to run models");
  }
  const response = await fetch(combineUrls(siteUrlSetting.get(forumType), LLM_RUN_ROUTE), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ runId }),
  });
  if (!response.ok) {
    throw new Error(`Starting LLM run ${runId} failed with status ${response.status}`);
  }
}
