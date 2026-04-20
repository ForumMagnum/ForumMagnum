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
    runPangramOnDocument(collectionName: String!, documentId: String!): PangramRunResult!
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
) {
  if (!document) throw new Error(`${documentKind} not found`);
  if (!document.contents_latest) throw new Error(`${documentKind} has no latest revision`);

  const eligibility = documentIsEligibleForPangram(document);
  if (!eligibility.eligible) {
    if (eligibility.skipStatus) {
      await recordPangramSkip(document.contents_latest, eligibility.skipStatus, context);
      return { status: eligibility.skipStatus, aiScore: null, rawResponse: null };
    }
    throw new Error(`${documentKind} is not eligible for Pangram (draft or rejected)`);
  }

  const revision = await context.Revisions.findOne({ _id: document.contents_latest });
  if (!revision) throw new Error(`Revision not found for ${documentKind}`);

  const text = extractText(document, revision.html);
  const result = await runPangramOnRevision(revision._id, text, context);
  return { status: result.status, aiScore: result.aiScore, rawResponse: result.rawResponse ?? null };
}

export const pangramGqlMutations = {
  async runPangramOnDocument(
    _root: void,
    args: { collectionName: string; documentId: string },
    context: ResolverContext,
  ) {
    const { currentUser } = context;
    if (!userIsAdminOrMod(currentUser)) {
      throw new Error("Only admins and moderators can run Pangram");
    }
    if (!pangramIsConfigured()) {
      throw new Error("Pangram is not configured on this instance");
    }

    const { collectionName, documentId } = args;

    if (collectionName === "Posts") {
      const post = await context.Posts.findOne({ _id: documentId });
      return runPangramForManualRequest(post, "post", (p, html) => extractPangramInputFromPost(p, html), context);
    }

    if (collectionName === "Comments") {
      const comment = await context.Comments.findOne({ _id: documentId });
      return runPangramForManualRequest(comment, "comment", (_c, html) => extractPangramInputFromComment(html), context);
    }

    throw new Error(`Unsupported collection for Pangram: ${collectionName}`);
  },
};
