import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client as GoogleOAuth2Client } from 'google-auth-library';
import { oauth2 } from '@googleapis/oauth2';
import { googleDocImportClientIdSetting, googleDocImportClientSecretSetting } from '@/server/databaseSettings';
import { combineUrls, getSiteUrl } from '@/lib/vulcan-lib/utils';
import { getUserFromReq } from '@/server/vulcan-lib/apollo-server/getUserFromReq';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import { updateActiveServiceAccount } from '@/server/posts/googleDocImport';

export async function GET(request: NextRequest) {
  const googleClientId = googleDocImportClientIdSetting.get();
  const googleOAuthSecret = googleDocImportClientSecretSetting.get();

  if (!googleClientId || !googleOAuthSecret) {
    return NextResponse.json(
      { error: 'Google Drive import not configured' },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  
  // Get user from request
  const user = await getUserFromReq(request);
  
  if (!user?._id || !userIsAdmin(user)) {
    return NextResponse.json(
      { error: 'User is not authenticated or not an admin' },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL('/admin/googleServiceAccount', getSiteUrl()));
  }

  const callbackUrl = "google_oauth2callback";
  const oauth2Client = new GoogleOAuth2Client(
    googleClientId,
    googleOAuthSecret,
    combineUrls(getSiteUrl(), callbackUrl)
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      throw new Error("Failed to create refresh_token");
    }

    oauth2Client.setCredentials(tokens);

    const userInfo = await oauth2({
      auth: oauth2Client,
      version: 'v2'
    }).userinfo.get();

    const email = userInfo?.data?.email;

    if (!email) {
      throw new Error("Failed to get email");
    }

    await updateActiveServiceAccount({
      email,
      refreshToken: tokens.refresh_token
    });

    return NextResponse.redirect(new URL('/admin/googleServiceAccount', getSiteUrl()));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error retrieving access token', error);
    return NextResponse.redirect(new URL('/admin/googleServiceAccount', getSiteUrl()));
  }
}
