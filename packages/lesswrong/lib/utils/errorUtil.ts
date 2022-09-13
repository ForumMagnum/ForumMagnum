import type { ApolloError } from '@apollo/client';

export function getGraphQLErrorID(error: any): string|null {
  if (!error) {
    return null;
  } else if (error.id) {
    return error.id;
  } else if (error.message) {
    try {
      const parsed = JSON.parse(error.message);
      return getGraphQLErrorID(parsed);
    } catch(e) {
      // It wasn't JSON
    }
  }
  
  return null;
}

export function getGraphQLErrorMessage(error: any): string {
  return getGraphQLErrorID(error) || "Error";
}

export function isMissingDocumentError(error: ApolloError): boolean {
  return (error && error.message==='app.missing_document');
}

export function isOperationNotAllowedError(error: ApolloError): boolean {
  return (error && error.message==='app.operation_not_allowed');
}
