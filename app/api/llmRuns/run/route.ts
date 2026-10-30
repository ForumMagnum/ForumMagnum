import { after, type NextRequest } from "next/server";
import { z } from "zod";
import { runLlmRun } from "@/server/languageModels/llmRuns";

export const maxDuration = 800;

const requestSchema = z.object({ runId: z.string() });

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { runId } = requestSchema.parse(await request.json());
  after(runLlmRun.bind(null, runId));
  return new Response(null, { status: 202 });
}
