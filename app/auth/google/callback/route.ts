import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initDatabases, initSettings } from '@/server/serverStartup';
import { exchangeCodeForTokens, fetchGoogleUserProfile } from '@/lib/auth/googleOAuth';
import { getOrCreateGoogleUser } from '@/server/authentication/googleAccounts';
import { createAndSetToken } from '@/server/vulcan-lib/apollo-server/authentication';
import { captureException } from '@sentry/core';

await initDatabases({
  postgresUrl: process.env.PG_URL || '',
  postgresReadUrl: process.env.PG_READ_URL || '',
});
await initSettings();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  
  const cookieStore = await cookies();
  
  // Handle errors
  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }
  
  // Verify state
  const storedState = cookieStore.get('google_oauth_state')?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL('/?error=invalid_state', request.url));
  }
  
  // Clear state cookie
  cookieStore.delete('google_oauth_state');
  
  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    // Fetch user profile
    const profile = await fetchGoogleUserProfile(tokens.access_token);
    
    // Create or update user
    const user = await getOrCreateGoogleUser(profile);

    if (user.banned && new Date(user.banned) > new Date()) {
      return NextResponse.redirect(new URL('/banNotice', request.url));
    }
    
    // Set login token
    await createAndSetToken(request.headers, user);
    
    // Get return URL
    const returnTo = cookieStore.get('google_oauth_return')?.value ?? '/';
    cookieStore.delete('google_oauth_return');
    
    return NextResponse.redirect(new URL(returnTo, request.url));
  } catch (error) {
    captureException(error);
    return NextResponse.redirect(new URL('/?error=authentication_failed', request.url));
  }
}
