import { isDevelopment } from '../../../lib/executionEnvironment';
import type { PlaygroundConfig } from '@apollo/server';

// GraphQL Playground setup
export const getPlaygroundConfig = (path: string): PlaygroundConfig|undefined => {
  // NOTE: this is redundant, Apollo won't show the GUI if NODE_ENV="production"
  if (!isDevelopment) return undefined;
  return {
    endpoint: path,
    // allow override
    //FIXME: this global option does not exist yet...
    // @see https://github.com/prisma/graphql-playground/issues/510
    //headers: { ["Authorization"]: 'localStorage[\'Meteor.loginToken\']' },
    // to set up headers, we are forced to create a tab
    tabs: [
      {
        endpoint: path,
        query: '{ currentUser { _id }}',
        // TODO: does not work, we should use a cookie instead?
        // @see https://github.com/prisma/graphql-playground/issues/849
        // headers: {['Authorization']: "localStorage['Meteor.loginToken']"},
      },
    ],
    settings: {
      'editor.theme': 'light',
      'editor.reuseHeaders': true,
      // pass cookies?
      'request.credentials': 'same-origin',
    },
  };
};
export default getPlaygroundConfig;
