import { hashLoginToken, tokenExpiration, userIsBanned } from '@/server/loginTokens';
import UsersRepo from '@/server/repos/UsersRepo';
import { unstable_cache } from 'next/cache';
import type { NextRequest } from 'next/server';

export const getUser = async (loginToken: string|null): Promise<DbUser|null> => {
  if (loginToken) {
    if (typeof loginToken !== 'string')
      throw new Error("Login token is not a string");

    const hashedToken = hashLoginToken(loginToken)

    const user = await new UsersRepo().getUserByLoginToken(hashedToken);

    if (user && !userIsBanned(user)) {
      // find the right login token corresponding, the current user may have
      // several sessions logged on different browsers / computers
      const tokenInformation = user.services.resume.loginTokens.find(
        (tokenInfo: AnyBecauseTodo) => tokenInfo.hashedToken === hashedToken
      )

      const expiresAt = tokenExpiration(tokenInformation.when)

      const isExpired = expiresAt < new Date()

      if (!isExpired) {
        return user
      }
    }
  }
  
  return null;
};

export const getCachedUser = unstable_cache(getUser, undefined, { revalidate: 5 });

export const getUserFromReq = async (req: NextRequest): Promise<DbUser | null> => {
  // We check both cookies and headers, because requests from the browser come with cookies,
  // but requests made by the apollo client (even during SSR) have to send it via header
  const loginToken = req.cookies.get('loginToken')?.value ?? req.headers.get('loginToken') ?? null;
  return getCachedUser(loginToken);
};
