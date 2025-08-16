import express from 'express';
import type { NextRequest } from 'next/server';

// Hack. Probably all code that calls this is dead.
export function requestToNextRequest(req: express.Request): NextRequest {
  return req as unknown as NextRequest;
}