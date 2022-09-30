import { useState } from "react";
import { createApolloClient } from "../../client/apolloClient";
import { fmCrosspostBaseUrlSetting } from "../../lib/instanceSettings";

export const useCrosspostApolloClient = () => {
  const [client] = useState(createApolloClient.bind(null, fmCrosspostBaseUrlSetting.get()));
  return client;
}
