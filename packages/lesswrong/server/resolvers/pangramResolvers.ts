import gql from "graphql-tag";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import {
  documentIsEligibleForPangram,
  extractPangramInputFromComment,
  extractPangramInputFromPost,
  pangramIsConfigured,
  recordPangramSkip,
  runPangramOnRevision,
} from "../pangram";

export const pangramGqlTypeDefs = gql`
  enum PangramStatus {
    scored
    too_short
    skipped_spam
    error
  }

  type PangramRunResult {
    status: PangramStatus!
    aiScore: Float
    rawResponse: JSON
  }

  extend type Mutation {
    runPangramOnDocument(collectionName: String!, documentId: String!, revisionId: String): PangramRunResult!
  }
`;

interface PangramEligibleDocument {
  _id: string;
  contents_latest: string | null;
  spam?: boolean | null;
  deleted?: boolean | null;
  draft?: boolean | null;
  rejected?: boolean | null;
}

async function runPangramForManualRequest<T extends PangramEligibleDocument>(
  document: T | null,
  documentKind: "post" | "comment",
  extractText: (doc: T, html: string | null) => string,
  context: ResolverContext,
  revisionId?: string | null,
) {
  if (!document) throw new Error(`${documentKind} not found`);
  const targetRevisionId = revisionId ?? document.contents_latest;
  if (!targetRevisionId) throw new Error(`${documentKind} has no target revision`);

  const eligibility = documentIsEligibleForPangram(document);
  if (!eligibility.eligible) {
    if (eligibility.skipStatus) {
      await recordPangramSkip(targetRevisionId, eligibility.skipStatus, context);
      return { status: eligibility.skipStatus, aiScore: null, rawResponse: null };
    }
    throw new Error(`${documentKind} is not eligible for Pangram (draft or rejected)`);
  }

  const revision = await context.Revisions.findOne({ _id: targetRevisionId });
  if (!revision) throw new Error(`Revision not found for ${documentKind}`);
  const expectedCollectionName = documentKind === "post" ? "Posts" : "Comments";
  if (
    revision.documentId !== document._id ||
    revision.fieldName !== "contents" ||
    (revision.collectionName && revision.collectionName !== expectedCollectionName)
  ) {
    throw new Error(`Revision does not belong to ${documentKind}`);
  }

  const text = extractText(document, revision.html);
  const result = await runPangramOnRevision(revision._id, text, context);
  return { status: result.status, aiScore: result.aiScore, rawResponse: result.rawResponse ?? null };
}

export const pangramGqlMutations = {
  async runPangramOnDocument(
    _root: void,
    args: { collectionName: string; documentId: string; revisionId?: string | null },
    context: ResolverContext,
  ) {
    const { currentUser } = context;
    if (!userIsAdminOrMod(currentUser)) {
      throw new Error("Only admins and moderators can run Pangram");
    }
    if (!pangramIsConfigured()) {
      throw new Error("Pangram is not configured on this instance");
    }

    const { collectionName, documentId, revisionId } = args;

    if (collectionName === "Posts") {
      const post = await context.Posts.findOne({ _id: documentId });
      return runPangramForManualRequest(post, "post", (p, html) => extractPangramInputFromPost(p, html), context, revisionId);
    }

    if (collectionName === "Comments") {
      const comment = await context.Comments.findOne({ _id: documentId });
      return runPangramForManualRequest(comment, "comment", (_c, html) => extractPangramInputFromComment(html), context, revisionId);
    }

    throw new Error(`Unsupported collection for Pangram: ${collectionName}`);
  },
};
