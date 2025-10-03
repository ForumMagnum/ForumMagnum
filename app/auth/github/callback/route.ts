import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForTokens, fetchGitHubUserProfile, getGitHubPrimaryEmail } from '@/lib/auth/githubOAuth';
import { getOrCreateGitHubUser } from '@/server/authentication/githubAccounts';
import { createAndSetToken } from '@/server/vulcan-lib/apollo-server/authentication';
import { captureException } from '@/lib/sentryWrapper';
import { getSiteUrl } from '@/lib/vulcan-lib/utils';


export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  
  const cookieStore = await cookies();
  
  // Handle errors
  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, getSiteUrl()));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', getSiteUrl()));
  }
  
  // Verify state
  const storedState = cookieStore.get('github_oauth_state')?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL('/?error=invalid_state', getSiteUrl()));
  }
  
  // Clear state cookie
  cookieStore.delete('github_oauth_state');
  
  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    // Fetch user profile
    const profile = await fetchGitHubUserProfile(tokens.access_token);
    
    // Fetch primary email if not in profile
    if (!profile.email) {
      profile.email = await getGitHubPrimaryEmail(tokens.access_token);
    }
    
    // Create or update user
    const user = await getOrCreateGitHubUser(profile);

    if (user.banned && new Date(user.banned) > new Date()) {
      return NextResponse.redirect(new URL('/banNotice', getSiteUrl()));
    }
    
    // Set login token
    await createAndSetToken(request.headers, user);
    
    // Get return URL
    const returnTo = cookieStore.get('github_oauth_return')?.value ?? '/';
    cookieStore.delete('github_oauth_return');
    
    return NextResponse.redirect(new URL(returnTo, getSiteUrl()));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error retrieving GitHub OAuth access token', error);
    captureException(error);
    return NextResponse.redirect(new URL('/?error=authentication_failed', getSiteUrl()));
  } finally {
    cookieStore.delete('github_oauth_state');
    cookieStore.delete('github_oauth_return');
  }
}
