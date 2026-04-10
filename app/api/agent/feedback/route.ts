import { captureException } from "@/lib/sentryWrapper";
import { NextRequest, NextResponse } from "next/server";
import { postMessage } from "@/server/slack/client";
import { z } from "zod";

const agentFeedbackSchema = z.object({
  message: z.string().trim().min(1).max(8000),
  type: z.enum(["bug_report", "functionality_gap", "user_requested_report", "other"]).default("other"),
  agentName: z.string().trim().min(1).max(200).optional(),
  userRequest: z.string().trim().min(1).max(2000).optional(),
  endpoint: z.string().trim().min(1).max(500).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

function buildSlackMessage(payload: z.infer<typeof agentFeedbackSchema>) {
  const lines = [
    ":lobster: *Agent API feedback submitted*",
    `*Type:* ${payload.type}`,
    payload.agentName ? `*Agent:* ${payload.agentName}` : null,
    payload.endpoint ? `*Endpoint:* ${payload.endpoint}` : null,
    payload.userRequest ? `*User request to relay:* ${payload.userRequest}` : null,
    "*Message:*",
    payload.message,
    payload.details ? `*Details JSON:* \`${JSON.stringify(payload.details)}\`` : null,
  ].filter((line): line is string => !!line);

  return lines.join("\n");
}

async function sendFeedbackToSlack(payload: z.infer<typeof agentFeedbackSchema>) {
  await postMessage({
    text: buildSlackMessage(payload),
    channelName: "agentFeedback",
    options: { mrkdwn: true },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = agentFeedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.format() },
        { status: 400 }
      );
    }

    await sendFeedbackToSlack(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    captureException(error);
    // eslint-disable-next-line no-console
    console.error("Failed to process /api/agent/feedback request", error);
    return NextResponse.json(
      {
        error: "Failed to submit feedback",
      },
      { status: 500 }
    );
  }
}
