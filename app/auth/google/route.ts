import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateOAuthState, getGoogleAuthUrl } from '@/lib/auth/googleOAuth';
import { initDatabases, initPostgres, initSettings } from '@/server/serverStartup';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

await initDatabases({
  postgresUrl: process.env.PG_URL || '',
  postgresReadUrl: process.env.PG_URL || '',
});
await initPostgres();
await initSettings();

const GOOGLE_OAUTH_COOKIE_SETTINGS: Omit<ResponseCookie, 'name' | 'value'> = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 60 * 30, // 30 minutes
  path: '/',
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get('returnTo') ?? '/';
  
  // Generate state for CSRF protection
  const state = generateOAuthState();
  
  // Store state in cookie for verification
  const cookieStore = await cookies();
  cookieStore.set('google_oauth_state', state, GOOGLE_OAUTH_COOKIE_SETTINGS);
  
  // Store returnTo if provided
  if (returnTo !== '/') {
    cookieStore.set('google_oauth_return', returnTo, GOOGLE_OAUTH_COOKIE_SETTINGS);
  }
  
  const authUrl = getGoogleAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
