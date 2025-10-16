import { ckEditorTokenHandler } from "@/server/ckEditor/ckEditorToken";
import type { NextRequest } from "next/server";
import { suggestedTimeouts } from "@/server/pageTimeouts";

export const maxDuration = suggestedTimeouts.simpleApiRoute;


export async function GET(req: NextRequest) {
  return ckEditorTokenHandler(req);
}
