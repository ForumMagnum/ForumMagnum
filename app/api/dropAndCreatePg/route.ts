import { testServerSetting } from "@/lib/instanceSettings";
import { dropAndCreatePg } from "@/server/testingSqlClient";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  if (!testServerSetting.get()) {
    return new Response("Not allowed", { status: 403 });
  }

  try {
    const { templateId } = await req.json();

    if (!templateId || typeof templateId !== "string") {
      throw new Error("No templateId provided");
    }

    await dropAndCreatePg({
      templateId,
      dropExisting: true,
    });

    return NextResponse.json({ status: "ok" });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return NextResponse.json({ status: "error", message: e.message }, { status: 500 });
  }
}
