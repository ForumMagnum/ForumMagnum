import schema from "@/lib/collections/elicitQuestions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null) {
  if (!user) return false;
  if (user.deleted) return false;
  return true;
}

function editCheck(user: DbUser | null) {
  return userIsAdminOrMod(user);
}

export async function createElicitQuestion({ data }: CreateElicitQuestionInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('ElicitQuestions', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ElicitQuestions', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('ElicitQuestions', documentWithId);

  return documentWithId;
}

export async function updateElicitQuestion({ selector, data }: UpdateElicitQuestionInput, context: ResolverContext) {
  const { currentUser, ElicitQuestions } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: elicitquestionSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('ElicitQuestions', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, ElicitQuestions, elicitquestionSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('ElicitQuestions', updatedDocument, oldDocument);

  backgroundTask(logFieldChanges({ currentUser, collection: ElicitQuestions, oldDocument, data: origData }));

  return updatedDocument;
}

export const createElicitQuestionGqlMutation = makeGqlCreateMutation('ElicitQuestions', createElicitQuestion, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ElicitQuestions', rawResult, context)
});

export const updateElicitQuestionGqlMutation = makeGqlUpdateMutation('ElicitQuestions', updateElicitQuestion, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ElicitQuestions', rawResult, context)
});




export const graphqlElicitQuestionTypeDefs = gql`
  input CreateElicitQuestionDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateElicitQuestionInput {
    data: CreateElicitQuestionDataInput!
  }
  
  input UpdateElicitQuestionDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateElicitQuestionInput {
    selector: SelectorInput!
    data: UpdateElicitQuestionDataInput!
  }
  
  type ElicitQuestionOutput {
    data: ElicitQuestion
  }

  extend type Mutation {
    createElicitQuestion(data: CreateElicitQuestionDataInput!): ElicitQuestionOutput
    updateElicitQuestion(selector: SelectorInput!, data: UpdateElicitQuestionDataInput!): ElicitQuestionOutput
  }
`;
