
import schema from "@/lib/collections/arbitalTagContentRels/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";


function newCheck(user: DbUser | null, document: CreateArbitalTagContentRelDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbArbitalTagContentRel | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


export async function createArbitalTagContentRel({ data }: CreateArbitalTagContentRelInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('ArbitalTagContentRels', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ArbitalTagContentRels', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('ArbitalTagContentRels', documentWithId);

  return documentWithId;
}

export async function updateArbitalTagContentRel({ selector, data }: UpdateArbitalTagContentRelInput, context: ResolverContext) {
  const { currentUser, ArbitalTagContentRels } = context;

  const {
    documentSelector: arbitaltagcontentrelSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('ArbitalTagContentRels', { selector, context, data, schema });

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, ArbitalTagContentRels, arbitaltagcontentrelSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('ArbitalTagContentRels', updatedDocument, updateCallbackProperties.oldDocument);

  return updatedDocument;
}

export const createArbitalTagContentRelGqlMutation = makeGqlCreateMutation('ArbitalTagContentRels', createArbitalTagContentRel, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ArbitalTagContentRels', rawResult, context)
});

export const updateArbitalTagContentRelGqlMutation = makeGqlUpdateMutation('ArbitalTagContentRels', updateArbitalTagContentRel, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ArbitalTagContentRels', rawResult, context)
});




export const graphqlArbitalTagContentRelTypeDefs = gql`
  input CreateArbitalTagContentRelDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateArbitalTagContentRelInput {
    data: CreateArbitalTagContentRelDataInput!
  }
  
  input UpdateArbitalTagContentRelDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateArbitalTagContentRelInput {
    selector: SelectorInput!
    data: UpdateArbitalTagContentRelDataInput!
  }
  
  type ArbitalTagContentRelOutput {
    data: ArbitalTagContentRel
  }

  extend type Mutation {
    createArbitalTagContentRel(data: CreateArbitalTagContentRelDataInput!): ArbitalTagContentRelOutput
    updateArbitalTagContentRel(selector: SelectorInput!, data: UpdateArbitalTagContentRelDataInput!): ArbitalTagContentRelOutput
  }
`;
