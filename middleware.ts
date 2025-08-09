import type { NextRequest } from 'next/server'
import { nextMiddleware } from "./packages/lesswrong/server/nextMiddleware";

export function middleware(request: NextRequest) {
  return nextMiddleware(request);
}

export const config = {
}
