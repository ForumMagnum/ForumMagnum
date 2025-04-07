
import { userCanCreateAndEditJargonTerms } from "@/lib/betas";
import schema from "@/lib/collections/jargonTerms/newSchema";
import { userIsPostCoauthor } from "@/lib/collections/posts/helpers";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { sanitizeJargonTerm } from "@/server/callbacks/jargonTermCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
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

const { createFunction, updateFunction } = getDefaultMutationFunctions('JargonTerms', {
  createFunction: async ({ data }: CreateJargonTermInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('JargonTerms', {
      context,
      data,
      schema,
      skipValidation,
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

    await runCountOfReferenceCallbacks({
      collectionName: 'JargonTerms',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

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
  },

  updateFunction: async ({ selector, data }: UpdateJargonTermInput, context, skipValidation?: boolean) => {
    const { currentUser, JargonTerms } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: jargontermSelector,
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('JargonTerms', { selector, context, data, schema, skipValidation });

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

    await runCountOfReferenceCallbacks({
      collectionName: 'JargonTerms',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    await reuploadImagesIfEditableFieldsChanged({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: JargonTerms, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'JargonTerms', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('JargonTerms', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'JargonTerms', rawResult, context)
});


export { createFunction as createJargonTerm, updateFunction as updateJargonTerm };
export { wrappedCreateFunction as createJargonTermMutation, wrappedUpdateFunction as updateJargonTermMutation };


export const graphqlJargonTermTypeDefs = gql`
  input CreateJargonTermDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateJargonTermInput {
    data: CreateJargonTermDataInput!
  }
  
  input UpdateJargonTermDataInput {
    ${getUpdatableGraphQLFields(schema)}
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
