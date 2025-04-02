
import schema from "@/lib/collections/subscriptions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { deleteOldSubscriptions } from "@/server/callbacks/subscriptionCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";

function newCheck(user: DbUser | null, document: CreateSubscriptionDataInput | null) {
  if (!user || !document) return false;
  return userCanDo(user, 'subscriptions.new');
}


const { createFunction } = getDefaultMutationFunctions('Subscriptions', {
  createFunction: async ({ data }: CreateSubscriptionInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Subscriptions', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    await deleteOldSubscriptions(data, context);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Subscriptions', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'Subscriptions',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Subscriptions', rawResult, context)
});


export { createFunction as createSubscription };
export { wrappedCreateFunction as createSubscriptionMutation };


export const graphqlSubscriptionTypeDefs = gql`
  input CreateSubscriptionDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateSubscriptionInput {
    data: CreateSubscriptionDataInput!
  }
  
  extend type Mutation {
    createSubscription(input: CreateSubscriptionInput!): Subscription
  }
`;
