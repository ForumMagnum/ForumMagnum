import schema from "@/lib/collections/userBlocks/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import { GraphQLError } from "graphql";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null, document: CreateUserBlockDataInput | null) {
  if (!user || !document) return false;
  if (document.blockedUserId === user._id) {
    throw new GraphQLError("You cannot block yourself.", {
      extensions: { noSentryCapture: true },
    });
  }
  return userCanDo(user, [
    "userblock.create",
    "userblocks.new",
  ]);
}

function editCheck(user: DbUser | null, document: DbUserBlock | null) {
  if (!user || !document) return false;

  return userOwns(user, document as HasUserIdType)
    ? userCanDo(user, [
      "userblock.update.own",
      "userblocks.edit.own",
    ])
    : userCanDo(user, [
      "userblock.update.all",
      "userblocks.edit.all",
    ]);
}

export async function createUserBlock({ data }: CreateUserBlockInput, context: ResolverContext) {
  const { currentUser } = context;

  if (currentUser && data.blockedUserId === currentUser._id) {
    throw new GraphQLError("You cannot block yourself.", {
      extensions: { noSentryCapture: true },
    });
  }

  const callbackProps = await getLegacyCreateCallbackProps("UserBlocks", {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, "UserBlocks", callbackProps);
  const documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate("UserBlocks", documentWithId);

  return documentWithId;
}

export async function updateUserBlock({ selector, data }: UpdateUserBlockInput, context: ResolverContext) {
  const { currentUser, UserBlocks } = context;

  const origData = cloneDeep(data);

  const {
    documentSelector: userBlockSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps("UserBlocks", { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  const updatedDocument = await updateAndReturnDocument(data, UserBlocks, userBlockSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate("UserBlocks", updatedDocument, oldDocument);

  backgroundTask(logFieldChanges({ currentUser, collection: UserBlocks, oldDocument, data: origData }));

  return updatedDocument;
}

export const createUserBlockGqlMutation = makeGqlCreateMutation("UserBlocks", createUserBlock, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, "UserBlocks", rawResult, context),
});

export const updateUserBlockGqlMutation = makeGqlUpdateMutation("UserBlocks", updateUserBlock, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, "UserBlocks", rawResult, context),
});

export const graphqlUserBlockTypeDefs = gql`
  input CreateUserBlockDataInput ${getCreatableGraphQLFields(schema)}

  input CreateUserBlockInput {
    data: CreateUserBlockDataInput!
  }
  
  input UpdateUserBlockDataInput ${getUpdatableGraphQLFields(schema)}

  input UpdateUserBlockInput {
    selector: SelectorInput!
    data: UpdateUserBlockDataInput!
  }
  
  type UserBlockOutput {
    data: UserBlock
  }

  extend type Mutation {
    createUserBlock(data: CreateUserBlockDataInput!): UserBlockOutput
    updateUserBlock(selector: SelectorInput!, data: UpdateUserBlockDataInput!): UserBlockOutput
  }
`;
