import { ckEditorTokenHandler } from "@/server/ckEditor/ckEditorToken";
import type { NextRequest } from "next/server";


export async function GET(req: NextRequest) {
  return ckEditorTokenHandler(req);
}
