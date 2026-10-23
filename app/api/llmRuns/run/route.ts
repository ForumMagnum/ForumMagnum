import type { NextRequest } from "next/server";
import { z } from "zod";
import { getForumTypeForRequest } from "@/server/utils/requestUtil";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { runLlmRun } from "@/server/languageModels/llmRuns";

// A run can take several minutes of searching and reading
export const maxDuration = 800;

const requestSchema = z.object({ runId: z.string() });

/**
 * Runs a model in the background. Called by `requestLlmRun`; responds as soon
 * as the run has started, and the run continues after the response.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { runId } = requestSchema.parse(await request.json());
  backgroundTask(runLlmRun(runId, getForumTypeForRequest(request)));
  return new Response(null, { status: 202 });
}
