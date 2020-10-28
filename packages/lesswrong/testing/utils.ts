import { newMutation, runQuery, setOnGraphQLError } from '../server/vulcan-lib';
import Users from '../lib/collections/users/collection';
import { Posts } from '../lib/collections/posts'
import { Comments } from '../lib/collections/comments'
import Conversations from '../lib/collections/conversations/collection';
import Messages from '../lib/collections/messages/collection';
import { randomId } from '../lib/random';


// Hooks Vulcan's runGraphQL to handle errors differently. By default, Vulcan
// would dump errors to stderr; instead, we want to (a) suppress that output,
// (b) assert that particular errors are present in unit tests, and (c) if no
// error was asserted to be present, assert that there were no errors.
//
// This should be called in unit tests from inside describe() but outside of
// it(). For example:
//
//   describe('Thing that uses GraphQL', async () => {
//     let graphQLErrorCatcher = catchGraphQLErrors();
//
//     it('produces a permission-denied error', async () => {
//       // Do a thing that produces an error
//
//       graphQLErrorCatcher.getErrors().should.equal(["app.mutation_not_allowed"]);
//     })
//
//     it('does not produce errors', async () => {
//       // Do a thing that should not produce errors
//       // Because this test does not interact with graphQLErrorCatcher, when
//       // it returns, it will implicitly assert that there were no errors.
//     })
//   });
export const catchGraphQLErrors = function(before?: any, after?: any) {
  class ErrorCatcher {
    errors: Array<any>
    errorsRetrieved: boolean
    
    constructor() {
      this.errors = [];
      this.errorsRetrieved = false;
    }

    getErrors() {
      this.errorsRetrieved = true;
      return this.errors;
    }
    cleanup() {
      if (!this.errorsRetrieved && this.errors.length>0) {
        //eslint-disable-next-line no-console
        console.error("Unexpected GraphQL errors in test:");
        //eslint-disable-next-line no-console
        console.error(this.errors);
        this.errors = [];
        this.errorsRetrieved = false;
        throw new Error(this.errors as any);
      }
      this.errors = [];
      this.errorsRetrieved = false;
    }
    addError(error: any) {
      if (Array.isArray(error)) {
        for (let i=0; i<error.length; i++) {
          this.errors.push(error);
        }
      } else {
        this.errors.push(error);
      }
    }
  }

  let errorCatcher = new ErrorCatcher();

  (before ? before : beforeEach)(() => {
    setOnGraphQLError((errors: any) => {
      errorCatcher.addError(errors);
    });
  });
  (after ? after : afterEach)(() => {
    errorCatcher.cleanup();
    setOnGraphQLError(null);
  });

  return errorCatcher;
};

// Given an error thrown from GraphQL, assert that it is permissions-flavored
// (as opposed to a type error, syntax error, or random unrecognized thing). If
// given an array of errors, asserts that all of them are permissions flavored.
export const assertIsPermissionsFlavoredError = (error: any): void => {
  if (!isPermissionsFlavoredError(error)) {
    //eslint-disable-next-line no-console
    console.error(JSON.stringify(error));
    throw new Error("Error is not permissions-flavored");
  }
}

const isPermissionsFlavoredError = (error: any): boolean => {
  if (Array.isArray(error)) {
    if (error.length === 0)
      return false;
    for(let i=0; i<error.length; i++) {
      if (!isPermissionsFlavoredError(error[i]))
        return false;
    }
    return true;
  }
  if (!error) {
    return false;
  }

  if ("app.validation_error" in error) {
    return true;
  }

  if (!error.message)
    return false;
  if (isPermissionsFlavoredErrorString(error.message))
    return true;
  
  let errorData: any = null;
  try {
    errorData = JSON.parse(error.message);
  } catch(e) {
    return false;
  }
  if (!errorData) return false;
  if (Array.isArray(errorData)) errorData = errorData[0];
  if (isPermissionsFlavoredErrorString(errorData)) return true;
  if (errorData.id && isPermissionsFlavoredErrorString(errorData.id)) return true;
  
  return false;
};

const isPermissionsFlavoredErrorString = (str: any): boolean => {
  switch (str)
  {
  case 'errors.disallowed_property_detected':
  case 'app.operation_not_allowed':
  case 'app.mutation_not_allowed':
  case 'app.user_cannot_moderate_post':
    return true;
  default:
    return false;
  }
}


export const createDefaultUser = async() => {
  // Creates defaultUser if they don't already exist
  const defaultUser = Users.findOne({username:"defaultUser"})
  if (!defaultUser) {
    return createDummyUser({username:"defaultUser"})
  } else {
    return defaultUser
  }
}

export const createDummyPost = async (user?: any, data?: any) => {
  const defaultUser = await createDefaultUser();
  const defaultData = {
    userId: (user && user._id) ? user._id : defaultUser._id,
    title: randomId(),
  }
  const postData = {...defaultData, ...data};
  const newPostResponse = await newMutation({
    collection: Posts,
    document: postData,
    currentUser: user || defaultUser,
    validate: false,
  });
  return newPostResponse.data
}

export const createDummyUser = async (data?: any) => {
  const testUsername = randomId()
  const defaultData = {
    username: testUsername,
    email: testUsername + "@test.lesserwrong.com",
    reviewedByUserId: "fakeuserid" // TODO: make this user_id correspond to something real that would hold up if we had proper validation
  }
  const userData = {...defaultData, ...data};
  const newUserResponse = await newMutation({
    collection: Users,
    document: userData,
    validate: false,
  })
  return newUserResponse.data;
}
export const createDummyComment = async (user: any, data?: any) => {
  const defaultUser = await createDefaultUser();
  let defaultData: any = {
    userId: (user || defaultUser)._id,
    contents: {
      originalContents: {
        type: "markdown",
        data: "This is a test comment"
      }
    },
  }
  if (!data.postId) {
    const randomPost = Posts.findOne()
    if (!randomPost) throw Error("Can't find any post to generate random comment for")
    defaultData.postId = randomPost._id; // By default, just grab ID from a random post
  }
  const commentData = {...defaultData, ...data};
  const newCommentResponse = await newMutation({
    collection: Comments,
    document: commentData,
    currentUser: user || defaultUser,
    validate: false,
  });
  return newCommentResponse.data
}

export const createDummyConversation = async (user: any, data?: any) => {
  let defaultData = {
    title: user.displayName,
    participantIds: [user._id],
  }
  const conversationData = {...defaultData, ...data};
  const newConversationResponse = await newMutation({
    collection: Conversations,
    document: conversationData,
    currentUser: user,
    validate: false,
  });
  return newConversationResponse.data
}

export const createDummyMessage = async (user: any, data?: any) => {
  const {ContentState, convertToRaw} = require('draft-js');
  let defaultData = {
    contents: convertToRaw(ContentState.createFromText('Dummy Message Content')),
    userId: user._id,
  }
  const messageData = {...defaultData, ...data};
  const newMessageResponse = await newMutation({
    collection: Messages,
    document: messageData,
    currentUser: user,
    validate: false,
  });
  return newMessageResponse.data
}

export const clearDatabase = async () => {
  Users.find().fetch().forEach((i)=>{
    Users.remove(i._id)
  })
  Posts.find().fetch().forEach((i)=>{
    Posts.remove(i._id)
  })
  Comments.find().fetch().forEach((i)=>{
    Posts.remove(i._id)
  })
}

// Replacement for JSON.stringify, because that puts quotes around keys, and GraphQL does not
// accept objects with quotes around the keys. 
// Copied from here: https://stackoverflow.com/a/11233515/8083739

// Jim's note: This will not work on objects that contain arrays that contain objects
function stringifyObject(obj_from_json){
  if(typeof obj_from_json !== "object" || Array.isArray(obj_from_json) || obj_from_json instanceof Date){
      // not an object or is a Date, stringify using native function
      return JSON.stringify(obj_from_json);
  }
  // Implements recursive object serialization according to JSON spec
  // but without quotes around the keys.
  let props = Object
      .keys(obj_from_json)
      .map(key => `${key}:${stringifyObject(obj_from_json[key])}`)
      .join(",");
  return `{${props}}`;
}

export const userUpdateFieldFails = async ({user, document, fieldName, newValue, collectionType, fragment}: any) => {
  if (newValue === undefined) {
    newValue = randomId()
  }

  let newValueString = JSON.stringify(newValue)
  if (typeof newValue === "object") {
    newValueString = stringifyObject(newValue)
  } 

  const query = `
    mutation {
      update${collectionType}(selector: {_id:"${document._id}"},data:{${fieldName}:${newValueString}}) {
        data {
          ${fragment || fieldName}
        }
      }
    }
  `;
  const response = runQuery(query,{},{currentUser:user})
  await (response as any).should.be.rejected;
}

export const userUpdateFieldSucceeds = async ({user, document, fieldName, collectionType, newValue, fragment}: any) => {

  let comparedValue = newValue

  if (newValue === undefined) {
    comparedValue = randomId()
    newValue = comparedValue;
  }

  let newValueString = JSON.stringify(newValue)
  if (typeof newValue === "object") {
    newValueString = stringifyObject(newValue)
  }

  const query = `
      mutation {
        update${collectionType}(selector: {_id:"${document._id}"},data:{${fieldName}:${newValueString}}) {
          data {
            ${fragment || fieldName}
          }
        }
      }
    `;
  const response = runQuery(query,{},{currentUser:user})
  const expectedOutput = { data: { [`update${collectionType}`]: { data: { [fieldName]: comparedValue} }}}
  return (response as any).should.eventually.deep.equal(expectedOutput);
}
