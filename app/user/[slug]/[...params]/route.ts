import Users from "@/server/collections/users/collection";
import { userGetProfileUrl } from "@/lib/collections/users/helpers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";


// This is the legacy `/user/:slug/:category?/:filter?` redirect route
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; params: string[] }> }
) {
  const { slug, params: additionalParams } = await params;
  
  if (!slug) {
    return new Response('No user slug provided', { status: 404 });
  }

  let user;
  try {
    user = await Users.findOne({ $or: [{ slug: slug }, { username: slug }] });
  } catch (error) {
    //eslint-disable-next-line no-console
    console.log('// Legacy User error', error, { slug, additionalParams });
    return new Response(`No legacy user found with: ${slug}`, { status: 404 });
  }
    
  if (user) {
    // Redirect to the user's profile page
    redirect(userGetProfileUrl(user, true));
  } else {
    //eslint-disable-next-line no-console
    console.log('// Missing legacy user', { slug, additionalParams });
    return new Response(`No legacy user found with: ${slug}`, { status: 404 });
  }
}
