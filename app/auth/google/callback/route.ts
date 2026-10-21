import { getForumTypeForRequest } from "@/server/utils/requestUtil";
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForTokens, fetchGoogleUserProfile } from '@/lib/auth/googleOAuth';
import { getOrCreateGoogleUser } from '@/server/authentication/googleAccounts';
import { createAndSetToken } from '@/server/vulcan-lib/apollo-server/authentication';
import { captureException } from '@/lib/sentryWrapper';
import { getSiteUrlFromReq } from '@/server/utils/getSiteUrl';
import { ConflictingAccountsError } from '@/server/authentication/conflictingAccountsError';
import { getLoginErrorUrl, getLoginWarningUrl, loginErrorCodes, loginWarningCodes, sanitizeLoginReturnTo } from '@/lib/auth/loginNotices';


export async function GET(request: NextRequest) {
  const siteUrl = getSiteUrlFromReq(request);
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  
  const cookieStore = await cookies();
  
  // Handle errors
  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, siteUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', siteUrl));
  }
  
  // Verify state
  const storedState = cookieStore.get('google_oauth_state')?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(new URL('/?error=invalid_state', siteUrl));
  }
  
  // Clear state cookie
  cookieStore.delete('google_oauth_state');
  
  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(request, code);
    
    // Fetch user profile
    const profile = await fetchGoogleUserProfile(tokens.access_token);
    
    // Create or update user
    const { user, conflictingAccounts } = await getOrCreateGoogleUser(profile, getForumTypeForRequest(request));

    if (user.banned && new Date(user.banned) > new Date()) {
      return NextResponse.redirect(new URL('/banNotice', siteUrl));
    }
    
    // Set login token
    await createAndSetToken(request.headers, user, getForumTypeForRequest(request));
    
    // Get return URL
    const returnTo = cookieStore.get('google_oauth_return')?.value ?? '/';
    cookieStore.delete('google_oauth_return');

    if (conflictingAccounts) {
      return NextResponse.redirect(new URL(getLoginWarningUrl(loginWarningCodes.conflictingAccounts, sanitizeLoginReturnTo(returnTo)), siteUrl));
    }
    
    return NextResponse.redirect(new URL(returnTo, siteUrl));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error retrieving Google OAuth access token', error);
    captureException(error);
    const errorCode = error instanceof ConflictingAccountsError
      ? loginErrorCodes.conflictingAccounts
      : loginErrorCodes.authenticationFailed;
    return NextResponse.redirect(new URL(getLoginErrorUrl(errorCode), siteUrl));
  } finally {
    cookieStore.delete('google_oauth_state');
    cookieStore.delete('google_oauth_return');
  }
}
