import { connectCrossposterCrosspostHandler } from "@/server/crossposting/handlers";
import { crosspostOptionsHandler } from "@/server/crossposting/cors";
import type { NextRequest } from "next/server";

export function POST(req: NextRequest) {
  return connectCrossposterCrosspostHandler(req);
}

export function OPTIONS(req: NextRequest) {
  return crosspostOptionsHandler(req);
}
