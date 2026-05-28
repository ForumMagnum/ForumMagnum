import schema from "@/lib/collections/revisions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { recomputeWhenSkipAttributionChanged, updateDenormalizedHtmlAttributionsDueToRev, upvoteOwnTagRevision } from "@/server/callbacks/revisionCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, insertAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";
import { dataToHTML, dataToWordCount, extractAndReplaceIframeWidgets } from "@/server/editor/conversionUtils";
import AutomatedContentEvaluations from "../automatedContentEvaluations/collection";
import { z } from "zod"; // Add this import for Zod
import { getOpenAI } from "@/server/languageModels/languageModelIntegration";
import { captureException } from "@/lib/sentryWrapper";
import { backgroundTask } from "@/server/utils/backgroundTask";
import Posts from "../posts/collection";
import ModerationTemplates from "../moderationTemplates/collection";
import { sendRejectionPM } from "@/server/callbacks/postCallbackFunctions";
import { randomId } from "@/lib/random";
import type { RevisionOriginalContentsData } from "@/lib/collections/revisions/revisionSchemaTypes";
import { htmlToChangeMetrics } from "@/server/editor/utils";

function editCheck(user: DbUser | null) {
  return userIsAdminOrMod(user);
}

// Options when creating a revision from server-side code. This extends CreateRevisionDataInput
// (which is the revision-associated graphql fields associated with a mutation) with identifiers
// for which collection/_id/field the revision goes with (which are not in the graphql fields
// list because they are typically implied from context).
export type CreateRevisionOptions = Omit<CreateRevisionDataInput, "originalContents" | "updateType"> & {
  html: string,
  originalContents: RevisionOriginalContentsData
  updateType?: DbRevision["updateType"]
  collectionName: CollectionNameString
  documentId: string
  fieldName: string
  version?: string
  draft?: boolean
  skipAttributions?: boolean
  legacyData?: any,
  user?: DbUser,
  isAdmin?: boolean,
  createdAt?: Date,
  previousHtmlForChangeMetrics?: string,
  dataWithDiscardedSuggestions?: string,
}
type BuildAndCreateRevisionOptions = Omit<CreateRevisionDataInput, "originalContents" | "updateType"> & {
  originalContents: RevisionOriginalContentsData
  updateType?: DbRevision["updateType"]
  collectionName: CollectionNameString
  documentId: string
  fieldName: string
  version?: string
  draft?: boolean
  skipAttributions?: boolean
  legacyData?: any,
  user: DbUser,
  isAdmin?: boolean,
  createdAt?: Date,
  previousHtmlForChangeMetrics?: string,
  dataWithDiscardedSuggestions?: string,
}

export async function buildAndCreateRevision(data: BuildAndCreateRevisionOptions, context: ResolverContext): Promise<DbRevision> {
  const { originalContents, user, isAdmin, dataWithDiscardedSuggestions } = data;
  const revisionData = await buildRevision({originalContents, user, isAdmin, dataWithDiscardedSuggestions, context});
  return createRevision({ data: {
    ...revisionData, ...data
  }}, context);
}

async function buildRevision({ originalContents, user, isAdmin, dataWithDiscardedSuggestions, context }: {
  originalContents: RevisionOriginalContentsData | null,
  user: DbUser,
  isAdmin?: boolean,
  dataWithDiscardedSuggestions?: string,
  context: ResolverContext,
}): Promise<{
  html: string,
  wordCount: number,
  originalContents: RevisionOriginalContentsData & { yjsState: string | null },
  editedAt: Date,
  userId: string,
}> {
  if (isAdmin === undefined) {
    isAdmin = user.isAdmin;
  }
  if (!originalContents) throw new Error ("Can't build revision without originalContents")

  const normalizedOriginalContents = {
    ...originalContents,
    yjsState: originalContents.yjsState ?? null,
  };
  const { data, type } = normalizedOriginalContents;
  const readerVisibleData = dataWithDiscardedSuggestions ?? data
  const html = await dataToHTML(readerVisibleData, type, context, { sanitize: !isAdmin || normalizedOriginalContents.type !== "html" })
  const wordCount = await dataToWordCount(readerVisibleData, type, context)

  return {
    html, wordCount, originalContents: normalizedOriginalContents,
    editedAt: new Date(),
    userId: user._id,
  };
}
// createRevision is not exposed through the graphql API, but is called from other server-side code
// and sort of mimics a graphql create mutator (which it at one point used to be). Users create
// revisions by editing objects with revision-controlled editable fields.
export async function createRevision({ data }: { data: CreateRevisionOptions }, context: ResolverContext): Promise<DbRevision> {
  const user = data.user ?? context.currentUser;
  if (!user) throw new Error("Must have a specified user or be logged in to create a revision");
  const isAdmin = data.isAdmin ?? user.isAdmin;

  const normalizedOriginalContents = {
    ...data.originalContents,
    yjsState: data.originalContents.yjsState ?? null,
  };
  const readerVisibleData = data.dataWithDiscardedSuggestions ?? normalizedOriginalContents.data
  const html = await dataToHTML(readerVisibleData, normalizedOriginalContents.type, context, { sanitize: !isAdmin || normalizedOriginalContents.type !== "html" })
  const wordCount = await dataToWordCount(readerVisibleData, normalizedOriginalContents.type, context)

  let revisionData = {
    ...data,
    html, wordCount,
    changeMetrics: htmlToChangeMetrics(data.previousHtmlForChangeMetrics ?? "", html),
    originalContents: normalizedOriginalContents,
    createdAt: data.createdAt ?? new Date(),
    userId: user._id
  };

  const callbackProps = await getLegacyCreateCallbackProps('Revisions', {
    context,
    data: revisionData,
    schema,
  });

  revisionData = callbackProps.document;

  revisionData = await runFieldOnCreateCallbacks(schema, revisionData, callbackProps);

  const originalContentsId = await createOriginalContentsRow(revisionData.originalContents, context);
  const dataWithOriginalContentsId = { ...revisionData, originalContentsId };

  let documentWithId = await insertAndReturnDocument(dataWithOriginalContentsId, 'Revisions', context);

  if (documentWithId.html?.includes("data-lexical-iframe-widget")) {
    const extractedHtml = await extractAndReplaceIframeWidgets(documentWithId.html, documentWithId._id);
    if (extractedHtml !== documentWithId.html) {
      await context.Revisions.rawUpdateOne(
        { _id: documentWithId._id },
        { $set: { html: extractedHtml } },
      );
      documentWithId = {
        ...documentWithId,
        html: extractedHtml,
      };
    }
  }

  await upvoteOwnTagRevision({
    revision: documentWithId,
    context
  })

  await updateDenormalizedHtmlAttributionsDueToRev({
    revision: documentWithId,
    skipDenormalizedAttributions: revisionData.skipAttributions ?? false,
    context
  });

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('Revisions', documentWithId);

  return documentWithId;
}

export async function createOriginalContentsRow(originalContents: RevisionOriginalContentsData | null, context: ResolverContext): Promise<string|null> {
  const { RevisionOriginalContents } = context;
  if (!originalContents) return null;
  const originalContentsId = randomId();
  await RevisionOriginalContents.rawInsert({
    _id: originalContentsId,
    createdAt: new Date(),
    originalContents: originalContents,
  });
  return originalContentsId;
}

export async function updateOriginalContentsForRevision(
  revision: Pick<DbRevision, "_id" | "originalContentsId">,
  originalContents: RevisionOriginalContentsData,
  context: ResolverContext,
): Promise<string | null> {
  if (revision.originalContentsId) {
    await context.RevisionOriginalContents.rawUpdateOne(
      { _id: revision.originalContentsId },
      { $set: { originalContents } },
    );
    return revision.originalContentsId;
  }

  const originalContentsId = await createOriginalContentsRow(originalContents, context);
  await context.Revisions.rawUpdateOne(
    { _id: revision._id },
    { $set: { originalContentsId } },
  );
  return originalContentsId;
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

  backgroundTask(logFieldChanges({ currentUser, collection: Revisions, oldDocument, data: origData }));

  return updatedDocument;
}

export const updateRevisionGqlMutation = makeGqlUpdateMutation('Revisions', updateRevision, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Revisions', rawResult, context)
});

export const graphqlRevisionTypeDefs = gql`
  input ContentTypeInput {
    type: String!
    data: ContentTypeData!
    yjsState: String
  }

  input CreateRevisionDataInput {
    originalContents: ContentTypeInput!
    commitMessage: String
    updateType: String
    dataWithDiscardedSuggestions: JSON
    googleDocMetadata: JSON
  }

  input UpdateRevisionDataInput ${
    getUpdatableGraphQLFields(schema)
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
