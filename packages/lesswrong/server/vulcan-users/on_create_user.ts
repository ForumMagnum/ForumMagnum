import Users from '../../lib/collections/users/collection';
import { userCanCreateField } from '../../lib/vulcan-users/permissions';
import { getCollectionHooks } from '../mutationCallbacks';
import { createAnonymousContext } from '../vulcan-lib/query';
import {
  runCallbacks,
  runCallbacksAsync,
  debug,
  debugGroup,
  debugGroupEnd,
} from '../vulcan-lib';
import { encodeIntlError } from '../../lib/vulcan-lib/utils';
import clone from 'lodash/clone';
import { onStartup, wrapAsync } from '../../lib/executionEnvironment';
import { getSchema } from '../../lib/utils/getSchema';
import { Accounts } from '../../lib/meteorAccounts';
import * as _ from 'underscore';

// Takes a function that returns a promise and wraps it with Meteor.wrapAsync
// Definitely gets rid of the `this` context, so only use with contextless functions
function asyncWrapper(func) {
  // First we have to wrap the function so that it takes a callback as it's last argument
  // because that is what Meteor.wrapAsync expects
  const functionWithCallback = (args, callback) => {
    const promise = Promise.resolve(func(...args))
    promise
      .then((value) => callback(null, value))
      .catch((err) => callback(err, null))
  }
  // Then we make sure to pass through the old arguments properly
  return (...args) => {
    return wrapAsync(functionWithCallback)(args)
  }
}

// TODO: the following should use async/await, but async/await doesn't seem to work with Accounts.onCreateUser
function onCreateUserCallback(options, user) {
  debug('');
  debugGroup('--------------- start \x1b[35m onCreateUser ---------------');
  debug(`Options: ${JSON.stringify(options)}`);
  debug(`User: ${JSON.stringify(user)}`);

  const hooks = getCollectionHooks("Users");
  const context = createAnonymousContext();
  const schema = getSchema(Users);

  delete options.password; // we don't need to store the password digest
  delete options.username; // username is already in user object

  options = runCallbacks({ name: 'user.create.validate.before', iterator: options });
  // OpenCRUD backwards compatibility
  options = runCallbacks({
    name: 'users.new.validate.before',
    iterator: options
  });

  // validate options since they can't be trusted
  Users.simpleSchema().validate(options);

  // check that the current user has permission to insert each option field
  _.keys(options).forEach(fieldName => {
    var field = schema[fieldName];
    if (!field || !userCanCreateField(user, field)) {
      throw new Error(
        encodeIntlError({ id: 'app.disallowed_property_detected', value: fieldName })
      );
    }
  });

  // extend user with options
  user = Object.assign(user, options);

  // run validation callbacks
  user = hooks.createValidate.runCallbacks({
    iterator: user,
    properties: [{
      currentUser: null,
      collection: Users,
      context,
    }] as any // TODO: Provide the arguments that are missing here, and remove this cast
  });
  // OpenCRUD backwards compatibility
  let validationErrors: Array<any> = [];
  user = hooks.newValidate.runCallbacks({
    iterator: user,
    properties: [null, validationErrors],
  });
  // TODO: Handle validationErrors

  // run onCreate step
  for (let fieldName of Object.keys(schema)) {
    let autoValue;
    const schemaField = schema[fieldName];
    if (schemaField.onCreate) {
      const document = clone(user);
      // eslint-disable-next-line no-await-in-loop
      autoValue = asyncWrapper(schemaField.onCreate)({ document, newDocument: document, fieldName });
    } else if (schemaField.onInsert) {
      // OpenCRUD backwards compatibility
      // eslint-disable-next-line no-await-in-loop
      autoValue = schemaField.onInsert(clone(user), user);
    }
    if (typeof autoValue !== 'undefined') {
      user[fieldName] = autoValue;
    }
  }

  // TODO: Make these vaguely typesafe
  user = asyncWrapper(runCallbacks)({ name: 'user.create.before', iterator: user, properties: {} });
  user = asyncWrapper(runCallbacks)({ name: 'users.new.sync', iterator: user });

  runCallbacksAsync({ name: 'user.create.async', properties: [{ data: user }] });
  // OpenCRUD backwards compatibility
  runCallbacksAsync({
    name: "users.new.async",
    properties: [user]
  });

  debug(`Modified User: ${JSON.stringify(user)}`);
  debugGroupEnd();
  debug('--------------- end \x1b[35m onCreateUser ---------------');
  debug('');

  return user;
}

onStartup(() => {
  if (typeof Accounts !== 'undefined') {
    Accounts.onCreateUser(onCreateUserCallback)
  }
});
