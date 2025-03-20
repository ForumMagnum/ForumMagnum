import { localeSetting } from "@/lib/publicSettings";
import { allCollections } from "../collections/allCollections";
import { getAllRepos } from "../repos";
import { generateDataLoaders } from "./apollo-server/context";

export const createAnonymousContext = (options?: Partial<ResolverContext>): ResolverContext => {
  const queryContext = {
    userId: null,
    clientId: null,
    visitorActivity: null,
    currentUser: null,
    headers: null,
    locale: localeSetting.get(),
    isSSR: false,
    isGreaterWrong: false,
    repos: getAllRepos(),
    ...allCollections,
    ...generateDataLoaders(),
    ...options,
  };
  
  return queryContext;
}

export const createAdminContext = (options?: Partial<ResolverContext>): ResolverContext => {
  return {
    ...createAnonymousContext(),
    // HACK: Instead of a full user object, this is just a mostly-empty object with isAdmin set to true
    currentUser: {isAdmin: true} as DbUser,
    ...options,
  };
}