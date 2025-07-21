import { updateCrosspostCrosspostHandler } from "@/server/crossposting/handlers";
import type { NextRequest } from "next/server";

export function POST(req: NextRequest) {
  return updateCrosspostCrosspostHandler(req);
}
