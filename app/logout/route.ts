import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSiteUrlFromReq } from '@/server/utils/getSiteUrl';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const siteUrl = getSiteUrlFromReq(request);
  
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

  // Otherwise redirect to homepage
  return NextResponse.redirect(new URL('/', siteUrl));
}

// Support POST method as well for forms that might use it
export async function POST(request: NextRequest) {
  return GET(request);
}
