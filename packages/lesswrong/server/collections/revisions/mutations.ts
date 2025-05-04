import schema from "@/lib/collections/revisions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { recomputeWhenSkipAttributionChanged, updateDenormalizedHtmlAttributionsDueToRev, upsertPolls, upvoteOwnTagRevision } from "@/server/callbacks/revisionCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";
import { saplingApiKey } from "@/lib/instanceSettings";
import { dataToMarkdown } from "@/server/editor/conversionUtils";
import AutomatedContentEvaluations from "../automatedContentEvaluations/collection";
import { z } from "zod"; // Add this import for Zod

function editCheck(user: DbUser | null) {
  return userIsAdminOrMod(user);
}

// This has mutators because of a few mutable metadata fields (eg
// skipAttributions), but most parts of revisions are create-only immutable.
export async function createRevision({ data }: { data: Partial<DbInsertion<DbRevision>> }, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('Revisions', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Revisions', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await Promise.all([
    upsertPolls({
      revision: documentWithId,
      context
    }),
    upvoteOwnTagRevision({
      revision: documentWithId,
      context
    })
  ]);

  await updateDenormalizedHtmlAttributionsDueToRev({
    revision: documentWithId,
    skipDenormalizedAttributions: documentWithId.skipAttributions,
    context
  });

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('Revisions', documentWithId);

  void createAutomatedContentEvaluation(documentWithId);

  return documentWithId;
}
export async function updateRevision({ selector, data }: UpdateRevisionInput, context: ResolverContext) {
  const { currentUser, Revisions } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: revisionSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('Revisions', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, Revisions, revisionSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('Revisions', updatedDocument, oldDocument);

  await recomputeWhenSkipAttributionChanged(updateCallbackProperties);

  void logFieldChanges({ currentUser, collection: Revisions, oldDocument, data: origData });

  if (!updatedDocument.draft) {
    void createAutomatedContentEvaluation(updatedDocument);
  }

  return updatedDocument;
}

export const updateRevisionGqlMutation = makeGqlUpdateMutation('Revisions', updateRevision, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Revisions', rawResult, context)
});



async function createAutomatedContentEvaluation(revision: DbRevision) {
  const key = saplingApiKey.get();
  if (!key) return;
  
  const markdown = dataToMarkdown(revision.html, "html");
  const textToCheck = markdown.slice(0, 10000)
  
  const response = await fetch('https://api.sapling.ai/api/v1/aidetect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      text: textToCheck,
    }),
  });

  const saplingEvaluation = await response.json();

  // Define single Zod schema for response validation
  const saplingResponseSchema = z.object({
    score: z.number(),
    sentence_scores: z.array(
      z.object({
        sentence: z.string(),
        score: z.number()
      })
    )
  });
  
  const validatedEvaluation = saplingResponseSchema.parse(saplingEvaluation);
  
  await AutomatedContentEvaluations.rawInsert({
    createdAt: new Date(),
    revisionId: revision._id,
    score: validatedEvaluation.score,
    sentenceScores: validatedEvaluation.sentence_scores,
  });
}

export const graphqlRevisionTypeDefs = gql`
  input UpdateRevisionDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateRevisionInput {
    selector: SelectorInput!
    data: UpdateRevisionDataInput!
  }

  type RevisionOutput {
    data: Revision
  }
  
  extend type Mutation {
    updateRevision(selector: SelectorInput!, data: UpdateRevisionDataInput!): RevisionOutput
  }
`;
