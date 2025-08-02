import { CLIENT_ID_COOKIE, CLIENT_ID_NEW_COOKIE } from '@/lib/cookies/cookies'
import { randomId } from '@/lib/random';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server'

export async function nextMiddleware(request: NextRequest) {
  const clientIdCookie = request.cookies.get(CLIENT_ID_COOKIE);
  if (!clientIdCookie) {
    const response = NextResponse.next();
    const clientId = randomId();
    request.cookies.set(CLIENT_ID_COOKIE, clientId);
    request.cookies.set(CLIENT_ID_NEW_COOKIE, "true");
    response.cookies.set(CLIENT_ID_COOKIE, clientId);
    response.cookies.set(CLIENT_ID_NEW_COOKIE, "true");
    return response;
  }
}
