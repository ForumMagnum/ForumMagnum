import { Observable, throwError } from "rxjs";
import { ApolloLink } from "@apollo/client/link";
import { BatchLink } from "@apollo/client/link/batch";
import type { BaseHttpLink } from "@apollo/client/link/http";
import {
  checkFetcher,
  defaultPrinter,
  fallbackHttpConfig,
  parseAndCheckHttpResponse,
  selectHttpOptionsAndBodyInternal,
  selectURI,
} from "@apollo/client/link/http";
import { filterOperationVariables } from "@apollo/client/link/utils";
import { __DEV__ } from "@apollo/client/utilities/environment";
import { compact } from "@apollo/client/utilities/internal";
import { maybe } from "@apollo/client/utilities/internal/globals";

const backupFetch = maybe(() => fetch);

export declare namespace BaseBatchGraphql2EndpointHttpLink {
  interface ContextOptions extends BaseHttpLink.ContextOptions {}

  interface Options extends BatchLink.Shared.Options, BaseHttpLink.Shared.Options {
    /**
     * The maximum number of operations to include in a single batch.
     *
     * @defaultValue 10
     */
    batchMax?: number;
  }
}

/**
 * Vendored from `@apollo/client/link/batch-http/BaseBatchHttpLink` with the default
 * URI changed to `/graphql2`, so we can evolve the transport without being pinned
 * to ApolloServer semantics.
 */
export class BaseBatchGraphql2EndpointHttpLink extends ApolloLink {
  private batchDebounce?: boolean;
  private batchInterval: number;
  private batchMax: number;
  private batcher: BatchLink;

  constructor(options: BaseBatchGraphql2EndpointHttpLink.Options = {}) {
    super();

    let {
      uri = "/graphql2",
      // use default global fetch if nothing is passed in
      fetch: preferredFetch,
      print = defaultPrinter,
      includeExtensions,
      preserveHeaderCase,
      batchInterval,
      batchDebounce,
      batchMax,
      batchKey,
      includeUnusedVariables = false,
      ...requestOptions
    } = options;

    if (__DEV__) {
      // Make sure at least one of preferredFetch, window.fetch, or backupFetch
      // is defined, so requests won't fail at runtime.
      checkFetcher(preferredFetch || backupFetch);
    }

    const linkConfig = {
      http: compact({ includeExtensions, preserveHeaderCase }),
      options: requestOptions.fetchOptions,
      credentials: requestOptions.credentials,
      headers: requestOptions.headers,
    };

    this.batchDebounce = batchDebounce;
    this.batchInterval = batchInterval || 10;
    this.batchMax = batchMax || 10;

    const batchHandler: BatchLink.BatchHandler = (operations) => {
      const chosenURI = selectURI(operations[0], uri);
      const context = operations[0].getContext();
      const contextConfig = {
        http: context.http,
        options: context.fetchOptions,
        credentials: context.credentials,
        headers: context.headers,
      };

      // uses fallback, link, and then context to build options
      const optsAndBody = operations.map((operation) => {
        const result = selectHttpOptionsAndBodyInternal(
          operation,
          print,
          fallbackHttpConfig,
          linkConfig,
          contextConfig,
        );

        if (result.body.variables && !includeUnusedVariables) {
          result.body.variables = filterOperationVariables(
            result.body.variables,
            operation.query,
          );
        }
        return result;
      });

      const loadedBody = optsAndBody.map(({ body }) => body);
      const httpOptions = optsAndBody[0].options;

      // There's no spec for using GET with batches.
      if (httpOptions.method === "GET") {
        return throwError(
          () => new Error("apollo-link-batch-http does not support GET requests"),
        );
      }

      try {
        httpOptions.body = JSON.stringify(loadedBody);
      } catch (parseError) {
        return throwError(() => parseError);
      }

      let controller: AbortController | undefined;
      if (!httpOptions.signal && typeof AbortController !== "undefined") {
        controller = new AbortController();
        httpOptions.signal = controller.signal;
      }

      return new Observable((observer) => {
        // Prefer constructor options.fetch (preferredFetch) if provided, and
        // otherwise fall back to the *current* global window.fetch function.
        const currentFetch = preferredFetch || maybe(() => fetch) || backupFetch;

        currentFetch(chosenURI, httpOptions)
          .then((response) => {
            // Make the raw response available in the context.
            operations.forEach((operation) => operation.setContext({ response }));
            return response;
          })
          .then(parseAndCheckHttpResponse(operations))
          .then((result) => {
            controller = undefined;
            observer.next(result);
            observer.complete();
            return result;
          })
          .catch((err) => {
            controller = undefined;
            observer.error(err);
          });

        return () => {
          if (controller) controller.abort();
        };
      });
    };

    batchKey =
      batchKey ||
      ((operation) => {
        const context = operation.getContext();
        const contextConfig = {
          http: context.http,
          options: context.fetchOptions,
          credentials: context.credentials,
          headers: context.headers,
        };
        // may throw error if config not serializable
        return selectURI(operation, uri) + JSON.stringify(contextConfig);
      });

    this.batcher = new BatchLink({
      batchDebounce: this.batchDebounce,
      batchInterval: this.batchInterval,
      batchMax: this.batchMax,
      batchKey,
      batchHandler,
    });
  }

  request(operation: ApolloLink.Operation, forward: ApolloLink.ForwardFunction) {
    return this.batcher.request(operation, forward);
  }
}


