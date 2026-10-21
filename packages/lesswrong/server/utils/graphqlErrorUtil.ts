import { captureException } from '@/lib/sentryWrapper';

// TODO: decide whether we want to always filter all of these out on /graphql requests
export const NOISY_GRAPHQL_ERROR_MESSAGES = new Set(['app.operation_not_allowed', 'app.missing_document', 'app.document_not_found']);

// Sentry rejects events over 1MB, so truncate very long queries rather than lose
// the whole event
const MAX_QUERY_LENGTH_IN_SENTRY = 100_000;

/**
 * An operation from a GraphQL request that failed before execution started (eg
 * because it had a syntax error, or requested fields that don't exist).
 */
export interface InvalidGraphQLOperation {
  query?: string | null
  operationName?: string | null
}

/**
 * Given an error that's probably of type GraphQLError, return whether it should be
 * captured in Sentry (default: true, false if the thrower put noSentryCapture:true
 * in the graphql error extensions field.)
 */
function shouldCaptureGraphQLErrorInSentry(error: any): boolean {
  return !((error as any)?.extensions?.noSentryCapture);
}

function truncateQueryForSentry(query: string | null | undefined) {
  // The query comes from the client, so it isn't necessarily a string
  if (typeof query !== 'string' || query.length <= MAX_QUERY_LENGTH_IN_SENTRY) {
    return query;
  }
  return `${query.slice(0, MAX_QUERY_LENGTH_IN_SENTRY)}... [truncated from ${query.length} characters]`;
}

/**
 * Capture an error from a GraphQL request in Sentry, unless the thrower marked it
 * noSentryCapture. If the error came from an invalid operation, pass that operation
 * so that its query is attached to the Sentry event; Sentry's automatic request
 * capture doesn't reliably include it. We don't attach the query for other errors,
 * since queries can contain sensitive values written inline rather than passed
 * as variables, and we'd rather not send those to Sentry except when needed.
 */
export function captureGraphQLErrorInSentry(error: unknown, invalidOperation?: InvalidGraphQLOperation) {
  if (!shouldCaptureGraphQLErrorInSentry(error)) {
    return;
  }
  if (!invalidOperation) {
    captureException(error);
    return;
  }
  captureException(error, {
    extra: {
      graphqlOperationName: invalidOperation.operationName,
      graphqlQuery: truncateQueryForSentry(invalidOperation.query),
    },
  });
}
