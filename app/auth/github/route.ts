import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateOAuthState, getGitHubAuthUrl } from '@/lib/auth/githubOAuth';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';


const GITHUB_OAUTH_COOKIE_SETTINGS: Omit<ResponseCookie, 'name' | 'value'> = {
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
  cookieStore.set('github_oauth_state', state, GITHUB_OAUTH_COOKIE_SETTINGS);
  
  // Store returnTo if provided
  if (returnTo !== '/') {
    cookieStore.set('github_oauth_return', returnTo, GITHUB_OAUTH_COOKIE_SETTINGS);
  }
  
  const context = await getContextFromReqAndRes({ req: request, isSSR: false });
  const authUrl = getGitHubAuthUrl(request, state, context.forumType);
  return NextResponse.redirect(authUrl);
}
