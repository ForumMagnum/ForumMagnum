import type { NextRequest } from "next/server";

function handler(req: NextRequest) {
  return new Response('OK', { status: 200 });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
export const HEAD = handler;
