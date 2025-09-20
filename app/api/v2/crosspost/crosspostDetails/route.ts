import { crosspostDetailsCrosspostHandler, crosspostOptionsHandler } from "@/server/crossposting/handlers";
import type { NextRequest } from "next/server";

export function POST(req: NextRequest) {
  return crosspostDetailsCrosspostHandler(req);
}

export function OPTIONS(req: NextRequest) {
  return crosspostOptionsHandler(req);
}
