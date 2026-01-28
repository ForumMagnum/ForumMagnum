
// TODO: decide whether we want to always filter all of these out on /graphql requests
export const NOISY_GRAPHQL_ERROR_MESSAGES = new Set(['app.operation_not_allowed', 'app.missing_document', 'app.document_not_found']);

/**
 * Given an error that's probably of type GraphQLError, return whether it should be
 * captured in Sentry (default: true, false if the thrower put noSentryCapture:true
 * in the graphql error extensions field.)
 */
export function shouldCaptureGraphQLErrorInSentry(error: any): boolean {
  return !((error as any)?.extensions?.noSentryCapture);
}
