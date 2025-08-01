import { userCanCreateAndEditJargonTerms } from "@/lib/betas";
import schema from "@/lib/collections/jargonTerms/newSchema";
import { userIsPostCoauthor } from "@/lib/collections/posts/helpers";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { sanitizeJargonTerm } from "@/server/callbacks/jargonTermCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import { backgroundTask } from "@/stubs/server/utils/backgroundTask";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

function userHasJargonTermPostPermission(user: DbUser | null, post: DbPost) {
  return userIsAdmin(user) || userOwns(user, post) || userIsPostCoauthor(user, post);
}

// TODO: come back to this to see if there are any other posts which can't have jargon terms
function postCanHaveJargonTerms(post: DbPost) {
  return !post.isEvent;
}

async function userCanCreateJargonTermForPost(user: DbUser | null, jargonTerm: DbJargonTerm | CreateJargonTermDataInput | null, context: ResolverContext) {
  const { Posts } = context;

  if (!jargonTerm || !userCanCreateAndEditJargonTerms(user)) {
    return false;
  }

  const post = await Posts.findOne({ _id: jargonTerm.postId });
  if (!post || !postCanHaveJargonTerms(post)) {
    return false;
  }

  return userHasJargonTermPostPermission(user, post);
}

function newCheck(user: DbUser | null, jargonTerm: CreateJargonTermDataInput | null, context: ResolverContext) {
  return userCanCreateJargonTermForPost(user, jargonTerm, context);
}

function editCheck(user: DbUser | null, jargonTerm: DbJargonTerm | null, context: ResolverContext) {
  return userCanCreateJargonTermForPost(user, jargonTerm, context);
}

export async function createJargonTerm({ data }: CreateJargonTermInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('JargonTerms', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  data = sanitizeJargonTerm(data);

  data = await createInitialRevisionsForEditableFields({
    doc: data,
    props: callbackProps,
  });

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'JargonTerms', callbackProps);
  let documentWithId = afterCreateProperties.document;

  documentWithId = await updateRevisionsDocumentIds({
    newDoc: documentWithId,
    props: afterCreateProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('JargonTerms', documentWithId);

  const asyncProperties = {
    ...afterCreateProperties,
    document: documentWithId,
    newDocument: documentWithId,
  };

  await uploadImagesInEditableFields({
    newDoc: documentWithId,
    props: asyncProperties,
  });

  return documentWithId;
}

export async function updateJargonTerm({ selector, data }: UpdateJargonTermInput, context: ResolverContext) {
  const { currentUser, JargonTerms } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: jargontermSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('JargonTerms', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  data = sanitizeJargonTerm(data);

  data = await createRevisionsForEditableFields({
    docData: data,
    props: updateCallbackProperties,
  });

  let updatedDocument = await updateAndReturnDocument(data, JargonTerms, jargontermSelector, context);

  updatedDocument = await notifyUsersOfNewPingbackMentions({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('JargonTerms', updatedDocument, oldDocument);

  await reuploadImagesIfEditableFieldsChanged({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  backgroundTask(logFieldChanges({ currentUser, collection: JargonTerms, oldDocument, data: origData }));

  return updatedDocument;
}

export const createJargonTermGqlMutation = makeGqlCreateMutation('JargonTerms', createJargonTerm, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'JargonTerms', rawResult, context)
});

export const updateJargonTermGqlMutation = makeGqlUpdateMutation('JargonTerms', updateJargonTerm, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'JargonTerms', rawResult, context)
});




export const graphqlJargonTermTypeDefs = gql`
  input CreateJargonTermDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateJargonTermInput {
    data: CreateJargonTermDataInput!
  }
  
  input UpdateJargonTermDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateJargonTermInput {
    selector: SelectorInput!
    data: UpdateJargonTermDataInput!
  }
  
  type JargonTermOutput {
    data: JargonTerm
  }

  extend type Mutation {
    createJargonTerm(data: CreateJargonTermDataInput!): JargonTermOutput
    updateJargonTerm(selector: SelectorInput!, data: UpdateJargonTermDataInput!): JargonTermOutput
  }
`;
