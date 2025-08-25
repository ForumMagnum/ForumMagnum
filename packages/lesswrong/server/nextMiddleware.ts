import { randomId } from '@/lib/random';
import { NextRequest, NextResponse } from 'next/server'

// These need to be defined here instead of imported from @/lib/cookies/cookies
// because that import chain contains a transitive import of lodash, which
// causes the middleware build to fail (lodash contains some "Dynamic Code Evaluation"
// somewhere).
const CLIENT_ID_COOKIE = 'clientId';
const CLIENT_ID_NEW_COOKIE = 'clientIdUnset';

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
