import { localeSetting } from '@/lib/instanceSettings';
import { forumTypeSetting } from '@/lib/forumTypeUtils';
import { getAllCollectionsByName } from "../collections/allCollections";
import { getAllRepos } from "../repos";
import { generateDataLoaders } from "./apollo-server/context";

export const createAnonymousContext = (options?: Partial<ResolverContext>): ResolverContext => {
  const forumType = options?.forumType ?? forumTypeSetting.get();
  return {
    forumType,
    userId: null,
    clientId: null,
    currentUser: null,
    headers: undefined,
    locale: localeSetting.get(forumType),
    isSSR: false,
    isGreaterWrong: false,
    isIssaRiceReader: false,
    repos: getAllRepos(),
    ...getAllCollectionsByName(),
    ...generateDataLoaders(),
    ...options,
  };
}

export const createAdminContext = (options?: Partial<ResolverContext>): ResolverContext => {
  return {
    ...createAnonymousContext(options),
    // HACK: Instead of a full user object, this is just a mostly-empty object with isAdmin set to true
    currentUser: {isAdmin: true} as DbUser,
    ...options,
  };
}
