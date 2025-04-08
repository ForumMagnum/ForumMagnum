
import schema from "@/lib/collections/lwevents/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { OwnableDocument, userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
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
  createFunction: async ({ data }: CreateLWEventInput, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('LWEvents', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

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

  updateFunction: async ({ selector, data }: UpdateLWEventInput, context) => {
    const { currentUser, LWEvents } = context;

    const {
      documentSelector: lweventSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('LWEvents', { selector, context, data, schema });

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, LWEvents, lweventSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'LWEvents',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    return updatedDocument;
  },
});

export const createLWEventGqlMutation = makeGqlCreateMutation('LWEvents', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'LWEvents', rawResult, context)
});

export const updateLWEventGqlMutation = makeGqlUpdateMutation('LWEvents', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'LWEvents', rawResult, context)
});


export { createFunction as createLWEvent, updateFunction as updateLWEvent };


export const graphqlLWEventTypeDefs = gql`
  input CreateLWEventDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateLWEventInput {
    data: CreateLWEventDataInput!
  }
  
  input UpdateLWEventDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateLWEventInput {
    selector: SelectorInput!
    data: UpdateLWEventDataInput!
  }
  
  type LWEventOutput {
    data: LWEvent
  }

  extend type Mutation {
    createLWEvent(data: CreateLWEventDataInput!): LWEventOutput
    updateLWEvent(selector: SelectorInput!, data: UpdateLWEventDataInput!): LWEventOutput
  }
`;
