import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isEAForum, siteUrlSetting } from '@/lib/instanceSettings';
import { auth0ClientIdSetting, auth0DomainSetting } from '@/server/databaseSettings';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  // Clear authentication cookies
  const cookiesToClear = ['meteor_login_token', 'loginToken', 'connect.sid'];
  
  cookiesToClear.forEach(cookieName => {
    // Check if cookie exists before trying to delete it
    if (cookieStore.has(cookieName)) {
      cookieStore.delete({
        name: cookieName,
        path: '/',
      });
    }
  });

  // Check if we need to redirect to Auth0 logout
  const auth0Domain = auth0DomainSetting.get();
  const auth0ClientId = auth0ClientIdSetting.get();
  
  if (auth0Domain && auth0ClientId && isEAForum) {
    // Redirect to Auth0 logout URL
    const returnUrl = encodeURIComponent(siteUrlSetting.get());
    const auth0LogoutUrl = `https://${auth0Domain}/v2/logout?client_id=${auth0ClientId}&returnTo=${returnUrl}`;
    
    return NextResponse.redirect(auth0LogoutUrl);
  }

  // Otherwise redirect to homepage
  return NextResponse.redirect(new URL('/', request.url));
}

// Support POST method as well for forms that might use it
export async function POST(request: NextRequest) {
  return GET(request);
}
