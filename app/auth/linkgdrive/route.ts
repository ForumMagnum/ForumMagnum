import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client as GoogleOAuth2Client } from 'google-auth-library';
import { googleDocImportClientIdSetting, googleDocImportClientSecretSetting } from '@/server/databaseSettings';
import { combineUrls } from '@/lib/vulcan-lib/utils';
import { getUserFromReq } from '@/server/vulcan-lib/apollo-server/getUserFromReq';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import { getSiteUrlFromReq } from '@/server/utils/getSiteUrl';

export async function GET(request: NextRequest) {
  const siteUrl = getSiteUrlFromReq(request);
  const googleClientId = googleDocImportClientIdSetting.get();
  const googleOAuthSecret = googleDocImportClientSecretSetting.get();

  if (!googleClientId || !googleOAuthSecret) {
    return NextResponse.json(
      { error: 'Google Drive import not configured' },
      { status: 500 }
    );
  }

  // Get user from request
  const user = await getUserFromReq(request);
  
  if (!user?._id || !userIsAdmin(user)) {
    return NextResponse.json(
      { error: 'User is not authenticated or not an admin' },
      { status: 400 }
    );
  }

  const callbackUrl = "google_oauth2callback";
  const oauth2Client = new GoogleOAuth2Client(
    googleClientId,
    googleOAuthSecret,
    combineUrls(siteUrl, callbackUrl)
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // offline => get a refresh token that persists for 6 months
    scope: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    redirect_uri: combineUrls(siteUrl, callbackUrl)
  });

  return NextResponse.redirect(url);
}
