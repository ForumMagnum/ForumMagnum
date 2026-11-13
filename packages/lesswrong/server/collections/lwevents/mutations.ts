
import schema from "@/lib/collections/lwevents/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getCreatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { assignUserIdToData, getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import { sendIntercomEvent, updatePartiallyReadSequences, updateReadStatus } from "./helpers";
import { recordAiDigestItemClick } from "@/server/aiDigest/aiDigestItemClicks";

// The events that clients record. Other events are created by the server, and
// some of their properties are trusted (eg rateLimitActivated's message, which
// is shown on the moderation log).
const clientCreatableEventNames = new Set([
  'post-view',
  'tag-view',
  'toggled-user-moderation-guidelines',
  'acknowledged-new-user-guidelines',
]);

function newCheck(user: DbUser | null, document: CreateLWEventDataInput | null) {
  if (!user || !document?.name || !clientCreatableEventNames.has(document.name)) return false;
  return userCanDo(user, 'events.new.own');
}

export async function createLWEvent({ data }: { data: CreateLWEventDataInput & { userId?: string } }, context: ResolverContext) {
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

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('LWEvents', documentWithId);

  const asyncProperties = {
    ...afterCreateProperties,
    document: documentWithId,
    newDocument: documentWithId,
  };

  await updatePartiallyReadSequences(asyncProperties);

  await recordAiDigestItemClick(documentWithId);

  await sendIntercomEvent(documentWithId, currentUser);

  return documentWithId;
}

export async function updateLWEvent({ selector, data }: { selector: SelectorInput, data: Partial<DbLWEvent> }, context: ResolverContext) {
  const { currentUser, LWEvents } = context;

  const {
    documentSelector: lweventSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('LWEvents', { selector, context, data, schema });

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, LWEvents, lweventSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('LWEvents', updatedDocument, updateCallbackProperties.oldDocument);

  return updatedDocument;
}

export const createLWEventGqlMutation = makeGqlCreateMutation('LWEvents', createLWEvent, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'LWEvents', rawResult, context)
});



export const graphqlLWEventTypeDefs = gql`
  input CreateLWEventDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateLWEventInput {
    data: CreateLWEventDataInput!
  }
  
  type LWEventOutput {
    data: LWEvent
  }

  extend type Mutation {
    createLWEvent(data: CreateLWEventDataInput!): LWEventOutput
  }
`;
