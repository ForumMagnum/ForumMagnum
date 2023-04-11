import { UserInputError } from 'apollo-server';
import { Utils } from '../../lib/vulcan-lib';

/*

An error should have: 

- id: will be used as i18n key (note: available as `name` on the client)
- message: optionally, a plain-text message
- data: data/values to give more context to the error

*/
export const throwError = (error: { id: string; data: Record<string, any> }) => {
  const { id, } = error;
  throw new UserInputError(id, error);
};

Utils.throwError = throwError;
