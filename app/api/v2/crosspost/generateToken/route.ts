import { crosspostOptionsHandler, generateTokenCrosspostHandler } from "@/server/crossposting/handlers";
import type { NextRequest } from "next/server";

export function POST(req: NextRequest) {
  return generateTokenCrosspostHandler(req);
}

export function OPTIONS(req: NextRequest) {
  return crosspostOptionsHandler(req);
}
