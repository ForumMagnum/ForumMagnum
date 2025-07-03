import type { NextRequest } from "next/server";

export function getClientIP(req: NextRequest): string|undefined {
  // From: https://stackoverflow.com/a/19524949 (which contains incorrect sample code!)
  const ip = (req.headers.get('x-forwarded-for') || '').split(',').shift()?.trim() // || 
  // TODO: annoyingly, Next's app router doesn't seem to give us the IncomingMessage which originally had these fields???
    // req.connection.remoteAddress || 
    // req.socket.remoteAddress || 
    // req.connection.socket?.remoteAddress
  
  return ip;
}
