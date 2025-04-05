
import schema from "@/lib/collections/subscriptions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { deleteOldSubscriptions } from "@/server/callbacks/subscriptionCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import { clone } from "underscore";

function newCheck(user: DbUser | null, document: CreateSubscriptionDataInput | null) {
  if (!user || !document) return false;
  return userCanDo(user, 'subscriptions.new');
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('Subscriptions', {
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

  updateFunction: async ({ selector, data }: { selector: SelectorInput, data: Partial<DbSubscription> }, context, skipValidation?: boolean) => {
    const { currentUser, Subscriptions } = context;

    const {
      documentSelector: subscriptionSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Subscriptions', { selector, context, data, schema, skipValidation });

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, Subscriptions, subscriptionSelector, context) ?? previewDocument as DbSubscription;

    await runCountOfReferenceCallbacks({
      collectionName: 'Spotlights',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    return updatedDocument;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Subscriptions', rawResult, context)
});


export { createFunction as createSubscription, updateFunction as updateSubscription };
export { wrappedCreateFunction as createSubscriptionMutation };


export const graphqlSubscriptionTypeDefs = gql`
  input CreateSubscriptionDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateSubscriptionInput {
    data: CreateSubscriptionDataInput!
  }
  
  type SubscriptionOutput {
    data: Subscription
  }
  
  extend type Mutation {
    createSubscription(data: CreateSubscriptionDataInput!): SubscriptionOutput
  }
`;
