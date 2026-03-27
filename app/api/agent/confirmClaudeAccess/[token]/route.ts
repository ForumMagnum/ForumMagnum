import { NextResponse } from "next/server";
import { executeEmailToken } from "@/server/emails/emailTokens";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const result = await executeEmailToken(token);
    return NextResponse.json({ ok: true, message: result.props.message });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    //eslint-disable-next-line no-console
    console.error("Error confirming Claude access:", e);
    return NextResponse.json({ error: 'Invalid token or already used' }, { status: 400 });
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ token: string }> }
) {
  return POST(req, context);
}
