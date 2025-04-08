
import { userCanUseTags } from "@/lib/betas";
import schema from "@/lib/collections/tagRels/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { taggedPostNewNotifications, validateTagRelCreate, voteForTagWhenCreated } from "@/server/callbacks/tagCallbackFunctions";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";

function newCheck(user: DbUser | null, tag: CreateTagRelDataInput | null) {
  return userCanUseTags(user);
}

function editCheck(user: DbUser | null, tag: DbTagRel | null) {
  return userCanUseTags(user);
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('TagRels', {
  createFunction: async ({ data }: CreateTagRelInput, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('TagRels', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    await validateTagRelCreate(data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'TagRels', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await updateCountOfReferencesOnOtherCollectionsAfterCreate('TagRels', documentWithId);

    documentWithId = await voteForTagWhenCreated(documentWithId, afterCreateProperties);

    await taggedPostNewNotifications(documentWithId, afterCreateProperties);

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateTagRelInput, context) => {
    const { currentUser, TagRels } = context;

    const {
      documentSelector: tagrelSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('TagRels', { selector, context, data, schema });

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, TagRels, tagrelSelector, context);

    await updateCountOfReferencesOnOtherCollectionsAfterUpdate('TagRels', updatedDocument, updateCallbackProperties.oldDocument);

    return updatedDocument;
  },
});

export const createTagRelGqlMutation = makeGqlCreateMutation('TagRels', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'TagRels', rawResult, context)
});

export const updateTagRelGqlMutation = makeGqlUpdateMutation('TagRels', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'TagRels', rawResult, context)
});


export { createFunction as createTagRel, updateFunction as updateTagRel };


export const graphqlTagRelTypeDefs = gql`
  input CreateTagRelDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateTagRelInput {
    data: CreateTagRelDataInput!
  }
  
  input UpdateTagRelDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateTagRelInput {
    selector: SelectorInput!
    data: UpdateTagRelDataInput!
  }
  
  type TagRelOutput {
    data: TagRel
  }

  extend type Mutation {
    createTagRel(data: CreateTagRelDataInput!): TagRelOutput
    updateTagRel(selector: SelectorInput!, data: UpdateTagRelDataInput!): TagRelOutput
  }
`;
