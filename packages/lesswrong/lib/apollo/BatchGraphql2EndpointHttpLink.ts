import { ApolloLink } from "@apollo/client/link";
import { ClientAwarenessLink } from "@apollo/client/link/client-awareness";
import { BaseBatchGraphql2EndpointHttpLink } from "./BaseBatchGraphql2EndpointHttpLink";

export declare namespace BatchGraphql2EndpointHttpLink {
  interface Options
    extends BaseBatchGraphql2EndpointHttpLink.Options,
      ClientAwarenessLink.Options {}

  interface ContextOptions
    extends BaseBatchGraphql2EndpointHttpLink.ContextOptions,
      ClientAwarenessLink.ContextOptions {}
}

/**
 * Vendored from `@apollo/client/link/batch-http/BatchHttpLink`, but routes to
 * `/graphql2` by default via `BaseBatchGraphql2EndpointHttpLink`.
 */
export class BatchGraphql2EndpointHttpLink extends ApolloLink {
  constructor(options: BatchGraphql2EndpointHttpLink.Options = {}) {
    const { left, right, request } = ApolloLink.from([
      new ClientAwarenessLink(options),
      new BaseBatchGraphql2EndpointHttpLink(options),
    ]);
    super(request);
    Object.assign(this, { left, right });
  }
}


