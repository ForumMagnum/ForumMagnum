import { NextResponse } from "next/server";
import { executeEmailToken } from "@/server/emails/emailTokens";
import { serverCaptureEvent } from "@/server/analytics/serverAnalyticsWriter";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const result = await executeEmailToken(token);
    serverCaptureEvent("claudeOnboardingConfirmed", { userId: result.userId });
    return NextResponse.json({ ok: true, message: result.props.message });
  } catch (e) {
    //eslint-disable-next-line no-console
    console.error("Error confirming Claude access:", e);
    return NextResponse.json({ error: "Invalid token or already used" }, { status: 400 });
  }
}
