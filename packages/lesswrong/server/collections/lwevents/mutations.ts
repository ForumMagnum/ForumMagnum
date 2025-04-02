
import schema from "@/lib/collections/lwevents/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { OwnableDocument, userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import { sendIntercomEvent, updatePartiallyReadSequences, updateReadStatus } from "./helpers";

function newCheck(user: DbUser | null, document: CreateLWEventDataInput | null) {
  if (!user || !document) return false;
  return userOwns(user, document as OwnableDocument) ? userCanDo(user, 'events.new.own') : userCanDo(user, `events.new.all`)
}

function editCheck(user: DbUser | null, document: DbLWEvent | null) {
  if (!user || !document) return false;
  return userCanDo(user, `events.edit.all`)
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('LWEvents', {
  createFunction: async ({ data }: CreateLWEventInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('LWEvents', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    await updateReadStatus(data, context);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'LWEvents', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'LWEvents',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };

    await updatePartiallyReadSequences(asyncProperties);
    
    await sendIntercomEvent(documentWithId, currentUser);

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateLWEventInput, context, skipValidation?: boolean) => {
    const { currentUser, LWEvents } = context;

    const {
      documentSelector: lweventSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('LWEvents', { selector, context, data, schema, skipValidation });

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, LWEvents, lweventSelector, context) ?? previewDocument as DbLWEvent;

    await runCountOfReferenceCallbacks({
      collectionName: 'LWEvents',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    return updatedDocument;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'LWEvents', rawResult, context)
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('LWEvents', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'LWEvents', rawResult, context)
});


export { createFunction as createLWEvent, updateFunction as updateLWEvent };
export { wrappedCreateFunction as createLWEventMutation, wrappedUpdateFunction as updateLWEventMutation };


export const graphqlLWEventTypeDefs = gql`
  input CreateLWEventDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateLWEventInput {
    data: CreateLWEventDataInput!
  }
  
  input UpdateLWEventDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateLWEventInput {
    selector: SelectorInput!
    data: UpdateLWEventDataInput!
  }
  
  extend type Mutation {
    createLWEvent(input: CreateLWEventInput!): LWEvent
    updateLWEvent(input: UpdateLWEventInput!): LWEvent
  }
`;
