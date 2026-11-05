import { siteUrlSetting } from "@/lib/instanceSettings";
import { combineUrls } from "@/lib/vulcan-lib/utils";

const LLM_RUN_ROUTE = "/api/llmRuns/run";

export async function requestLlmRun(runId: string): Promise<void> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    throw new Error("CRON_SECRET must be set to run models");
  }
  const response = await fetch(combineUrls(siteUrlSetting.get("LessWrong"), LLM_RUN_ROUTE), {
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
