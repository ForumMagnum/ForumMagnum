import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { createApolloClient } from "../../client/apolloClient";
import { fmCrosspostBaseUrlSetting } from "../../lib/instanceSettings";

let apolloClient: ApolloClient<NormalizedCacheObject> | undefined;

export const useCrosspostApolloClient = () => {
  if (!apolloClient) {
    apolloClient = createApolloClient(fmCrosspostBaseUrlSetting.get() ?? undefined);
  }
  return apolloClient;
}
