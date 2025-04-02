
import schema from "@/lib/collections/petrovDayActions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks } from "@/server/vulcan-lib/mutators";
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

const { createFunction } = getDefaultMutationFunctions('PetrovDayActions', {
  createFunction: async ({ data }: CreatePetrovDayActionInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('PetrovDayActions', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'PetrovDayActions', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'PetrovDayActions',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PetrovDayActions', rawResult, context)
});


export { createFunction as createPetrovDayAction };
export { wrappedCreateFunction as createPetrovDayActionMutation };

export const graphqlPetrovDayActionTypeDefs = gql`
  input CreatePetrovDayActionDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreatePetrovDayActionInput {
    data: CreatePetrovDayActionDataInput!
  }
  
  extend type Mutation {
    createPetrovDayAction(input: CreatePetrovDayActionInput!): PetrovDayAction
  }
`;
