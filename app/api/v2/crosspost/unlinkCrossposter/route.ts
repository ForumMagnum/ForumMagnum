import { unlinkCrossposterCrosspostHandler } from "@/server/crossposting/handlers";
import { crosspostOptionsHandler } from "@/server/crossposting/cors";
import type { NextRequest } from "next/server";
import { suggestedTimeouts } from "@/server/pageTimeouts";

export const maxDuration = suggestedTimeouts.crazyApiRoute;

export function POST(req: NextRequest) {
  return unlinkCrossposterCrosspostHandler(req);
}

export function OPTIONS(req: NextRequest) {
  return crosspostOptionsHandler(req);
}
