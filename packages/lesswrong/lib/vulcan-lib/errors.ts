import isEmpty from 'lodash/isEmpty';
import { getCollectionName } from './collections';
import { UserInputError } from 'apollo-server-errors';
import { createError } from 'apollo-errors'
import { GraphQLError } from 'graphql';

/*

Get whatever word is contained between the first two double quotes

*/
const getFirstWord = (input: string) => {
  const parts = /"([^"]*)"/.exec(input);
  if (parts === null) {
    return null;
  }
  return parts[1];
};

/* 

Parse a GraphQL error message

TODO: check if still useful?

Sample message: 

"GraphQL error: Variable "$data" got invalid value {"meetingDate":"2018-08-07T06:05:51.704Z"}.
In field "name": Expected "String!", found null.
In field "stage": Expected "String!", found null.
In field "addresses": Expected "[JSON]!", found null."

*/

const parseErrorMessage = (message: AnyBecauseTodo) => {

  if (!message) {
    return null;
  }

  // note: optionally add .slice(1) at the end to get rid of the first error, which is not that helpful
  let fieldErrors = message.split('\n');

  fieldErrors = fieldErrors.map((error: AnyBecauseTodo) => {
    // field name is whatever is between the first to double quotes
    const fieldName = getFirstWord(error);
    if (error.includes('found null')) {
      // missing field errors
      return {
        id: 'errors.required',
        path: fieldName,
        properties: {
          name: fieldName,
        },
      };
    } else {
      // other generic GraphQL errors
      return {
        message: error,
      };
    }
  });
  return fieldErrors;
};

/*

Errors can have the following properties stored on their `data` property:
  - id: used as an internationalization key, for example `errors.required`
  - path: for field-specific errors inside forms, the path of the field with the issue
  - properties: additional data. Will be passed to vulcan-i18n as values
  - message: if id cannot be used as i81n key, message will be used
  
Scenario 1: normal error thrown with new Error(), put it in array and return it

Scenario 2: multiple GraphQL errors stored on data.errors

Scenario 3: single GraphQL error with data property

Scenario 4: single GraphQL error with no data property

*/
export const getErrors = (error: AnyBecauseTodo) => {
  // if this is one or more GraphQL errors, extract and convert them
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    // get graphQL error (see https://github.com/thebigredgeek/apollo-errors/issues/12)
    const graphQLError = error.graphQLErrors[0]
    const data = (graphQLError?.extensions?.exception?.data) || graphQLError?.data

    let baseErrorMessages = parseErrorMessage(graphQLError?.message)
    if (data && !isEmpty(data)) {
      if (data.errors) {
        // 2. There are multiple errors on the data.errors object
        // Check for helpful message
        if (data.errors.some((e: AnyBecauseTodo) => e.message)) {
          return data.errors
        }
        // Otherwise we need at least one helpful message
        return baseErrorMessages.concat(data.errors)
      }
      // 3. There is only one error
      // Check for helpful message
      if (data.message) {
        return [data]
      }
      // Again we need a helpful message
      return baseErrorMessages.concat([data])
    }
    // 4. There is no data object, just use the raw error messages
    return baseErrorMessages
  }
  // 1. Wrap in array
  return [error]
}


// Vulcan throws validation errors via interpreting the schema, but you can use this function to throw them manually.
// Vulcan can throw multiple validation errors at once, but this function only throws one at a time.
// Note that field names inserted in error descriptions capitalize the first letter by default. You can avoid this
// with capitalizeName: false.
export const throwValidationError = ({
    typeName,
    field,
    errorType,
    alias,
    capitalizeName = true
  }: {
    typeName: string, // e.g "Comment", "Post", "User"
    field: string,
    errorType: 'errors.required' | 'errors.expectedType' | 'errors.maxString' | 'errors.regEx' | 'errors.disallowed_property_detected',
    alias?: string, // i.e. the field name as described in the message to the user, which you might want to change from the schema field name
    capitalizeName?: boolean
  }
) => {
  const collectionName = getCollectionName(typeName);
  const required = errorType === 'errors.required';
  const displayFieldName = (capitalizeName ? '' : ' ') + (alias || field);

  throw new UserInputError(
    'app.validation_error',
    {
      id: 'app.validation_error',
      data: {
        break: true,
        errors: [{
          id: errorType,
          path: field,
          properties: {
            collectionName,
            name: displayFieldName,
            type: required,
            typeName
          }
        }]
      }
    }
  )
};

export const SimpleValidationError = createError(
  'SimpleValidationError',
  {
    message: "Validation error",
  }
)

export const AuthorizationError = createError(
  'AuthorizationError',
  {
    message: "Sorry, the email provided doesn't have access to the Waking Up Community. Email community@wakingup.com if you think this is a mistake.",
  }
)

export const RateLimitError = createError(
  'RateLimitError',
  {
    message: "You can't do that again yet.",
  }
)

const whitelistedErrors = ["SimpleValidationError", "AuthorizationError", "RateLimitError"]

// Most errors shouldn't be shown to the user. Only a few specific ones should,
// and they're whitelisted here.
export const shouldHideErrorDetailsFromUser = (e: GraphQLError) => {
  if (!e?.extensions?.code) return false;
  if (e.extensions.code === 'BAD_USER_INPUT') return false;
  if (e.extensions.code === 'UNAUTHENTICATED') return false;
  if (whitelistedErrors.includes(e?.extensions?.exception?.name)) return false;

  return true
}
