import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSiteUrl } from '@/lib/vulcan-lib/utils';

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

  // Redirect to homepage
  return NextResponse.redirect(new URL('/', getSiteUrl()));
}

// Support POST method as well for forms that might use it
export async function POST(request: NextRequest) {
  return GET(request);
}
