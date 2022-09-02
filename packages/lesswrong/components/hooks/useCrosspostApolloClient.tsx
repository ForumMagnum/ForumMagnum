import { createApolloClient } from "../../client/apolloClient";
import { fmCrosspostBaseUrlSetting } from "../../lib/instanceSettings";

/**
 * Don't cache the client here - always create a new one to avoid memory leaks
 * https://github.com/apollographql/apollo-client/issues/7942#issuecomment-812540838
 */
export const useCrosspostApolloClient = () => createApolloClient(fmCrosspostBaseUrlSetting.get() ?? undefined);
