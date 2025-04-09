
import schema from "@/lib/collections/petrovDayActions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getCreatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";

async function newCheck(user: DbUser | null, document: CreatePetrovDayActionDataInput | null, context: ResolverContext) {
  const { PetrovDayActions } = context;

  if (!user || !document) return false
  
  const userRoleInfo = await PetrovDayActions.findOne({userId: user?._id, actionType: "hasRole"})
  const userRole = userRoleInfo?.data?.role

  if (userRole === "westGeneral" && document?.actionType === "nukeTheEast") {
    return true
  }
  if (userRole === "eastGeneral" && document?.actionType === "nukeTheWest") {
    return true
  }
  if (userRole === "eastPetrov" && document?.actionType === "eastPetrovAllClear") {
    return true
  }
  if (userRole === "eastPetrov" && document?.actionType === "eastPetrovNukesIncoming") {
    return true
  }
  if (userRole === "westPetrov" && document?.actionType === "westPetrovAllClear") {
    return true
  }
  if (userRole === "westPetrov" && document?.actionType === "westPetrovNukesIncoming") {
    return true
  }
  
  return false
}

export async function createPetrovDayAction({ data }: CreatePetrovDayActionInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('PetrovDayActions', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'PetrovDayActions', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('PetrovDayActions', documentWithId);

  return documentWithId;
}

export const createPetrovDayActionGqlMutation = makeGqlCreateMutation('PetrovDayActions', createPetrovDayAction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PetrovDayActions', rawResult, context)
});



export const graphqlPetrovDayActionTypeDefs = gql`
  input CreatePetrovDayActionDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreatePetrovDayActionInput {
    data: CreatePetrovDayActionDataInput!
  }

  type PetrovDayActionOutput {
    data: PetrovDayAction
  }
  
  extend type Mutation {
    createPetrovDayAction(data: CreatePetrovDayActionDataInput!): PetrovDayActionOutput
  }
`;
