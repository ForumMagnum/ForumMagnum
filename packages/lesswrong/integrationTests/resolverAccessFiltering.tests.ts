import "./integrationTestSetup";
import { runQuery } from "@/server/vulcan-lib/query";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { loadMultipleEntitiesById } from "@/server/resolvers/ultraFeedResolverHelpers";
import { Posts } from "@/server/collections/posts/collection";
import { TypoSuggestions } from "@/server/collections/typoSuggestions/collection";
import { randomId } from "@/lib/random";
import {
  catchGraphQLErrors,
  createDummyConversation,
  createDummyMessage,
  createDummyPost,
  createDummyUser,
  createDummyVote,
  waitUntilPgQueriesFinished,
} from "./utils";

// These tests check that custom resolvers which return collection-typed
// objects run them through accessFilterSingle/accessFilterMultiple, so that
// callers can't select fields (or documents) they aren't allowed to read.

const adminOnlyPostFields = {
  userAgent: "test-user-agent",
  referrer: "https://example.com/test-referrer",
};

// Creates a published post with admin-only fields set, and with a high enough
// score to be recommendable (which has to be set after creation, since post
// creation resets the score).
async function createPostWithAdminOnlyFields(author: DbUser) {
  const post = await createDummyPost(author);
  await Posts.rawUpdateOne({ _id: post._id }, { $set: { ...adminOnlyPostFields, baseScore: 100 } });
  return post;
}

describe("Vote mutations", () => {
  const graphQLErrors = catchGraphQLErrors();

  it("don't return admin-only fields of the voted-on document", async () => {
    const author = await createDummyUser();
    const voter = await createDummyUser();
    const post = await createPostWithAdminOnlyFields(author);

    // Omitting voteType clears the user's votes, which is a no-op here
    const { data } = await runQuery(`
      mutation performVotePost($documentId: String) {
        performVotePost(documentId: $documentId) {
          document { _id userAgent referrer }
        }
      }
    `, { documentId: post._id }, { currentUser: voter });

    expect(data?.performVotePost.document._id).toBe(post._id);
    expect(data?.performVotePost.document.userAgent).toBeNull();
    expect(data?.performVotePost.document.referrer).toBeNull();
  });

  it("return the document's updated score", async () => {
    const author = await createDummyUser();
    const voter = await createDummyUser();
    const post = await createDummyPost(author);
    const scoreBeforeVote = (await Posts.findOne({ _id: post._id }))?.baseScore;

    const { data } = await runQuery(`
      mutation setVotePost($documentId: String, $voteType: String) {
        setVotePost(documentId: $documentId, voteType: $voteType) { _id baseScore }
      }
    `, { documentId: post._id, voteType: "smallUpvote" }, { currentUser: voter });

    expect(data?.setVotePost._id).toBe(post._id);
    expect(data?.setVotePost.baseScore).toBeGreaterThan(scoreBeforeVote ?? 0);
  });

  it("reject votes on draft posts the voter can't see", async () => {
    const author = await createDummyUser();
    const voter = await createDummyUser();
    const draft = await createDummyPost(author, { draft: true });

    await expect(runQuery(`
      mutation performVotePost($documentId: String) {
        performVotePost(documentId: $documentId) {
          document { _id title htmlBody }
        }
      }
    `, { documentId: draft._id }, { currentUser: voter })).rejects.toThrow("No such document ID");
    graphQLErrors.getErrors();
  });

  it("reject votes on messages in conversations the voter isn't in", async () => {
    const sender = await createDummyUser();
    const voter = await createDummyUser();
    const conversation = await createDummyConversation(sender);
    const message = await createDummyMessage(sender, {
      conversationId: conversation._id,
      contents: { originalContents: { type: "html", data: "<p>Private message</p>" } },
    });

    await expect(runQuery(`
      mutation performVoteMessage($documentId: String) {
        performVoteMessage(documentId: $documentId) {
          document { _id contents { html } }
        }
      }
    `, { documentId: message._id }, { currentUser: voter })).rejects.toThrow("No such document ID");
    graphQLErrors.getErrors();
  });
});

describe("TypoSuggestion.reactor", () => {
  it("doesn't return the reactor's private fields to the post author", async () => {
    const author = await createDummyUser();
    const reactor = await createDummyUser();
    const post = await createDummyPost(author);
    const vote = await createDummyVote(reactor, { documentId: post._id, collectionName: "Posts" });
    const typoSuggestionId = await TypoSuggestions.rawInsert({
      documentId: post._id,
      collectionName: "Posts",
      fieldName: "contents",
      voteId: vote._id,
      authorId: author._id,
      quote: randomId(),
      llmCanonicalQuote: null,
      proposedReplacement: null,
      narrowedQuote: null,
      narrowedReplacement: null,
      explanation: null,
      llmVerdict: "pending",
      status: "pending",
      resolvedByUserId: null,
      appliedRevisionId: null,
      resolvedAt: null,
      createdAt: new Date(),
    });

    const { data } = await runQuery(`
      query typoSuggestion($selector: SelectorInput) {
        typoSuggestion(selector: $selector) {
          result { _id reactor { _id email } }
        }
      }
    `, { selector: { _id: typoSuggestionId } }, { currentUser: author });

    expect(data?.typoSuggestion.result.reactor._id).toBe(reactor._id);
    expect(data?.typoSuggestion.result.reactor.email).toBeNull();
  });
});

describe("Recommendations with a strategy", () => {
  it("don't return admin-only fields of recommended posts", async () => {
    const author = await createDummyUser();
    const reader = await createDummyUser();
    const sourcePost = await createPostWithAdminOnlyFields(author);
    const recommendedPost = await createPostWithAdminOnlyFields(author);
    await waitUntilPgQueriesFinished();

    const { data } = await runQuery(`
      query Recommendations($count: Int, $algorithm: JSON) {
        Recommendations(count: $count, algorithm: $algorithm) { _id userAgent referrer }
      }
    `, {
      count: 10,
      algorithm: {
        strategy: { name: "moreFromAuthor", postId: sourcePost._id },
        disableFallbacks: true,
      },
    }, { currentUser: reader });

    const result = data?.Recommendations.find((post: { _id: string }) => post._id === recommendedPost._id);
    expect(result).toBeTruthy();
    expect(result.userAgent).toBeNull();
    expect(result.referrer).toBeNull();
  });
});

describe("UltraFeed entity loading", () => {
  it("leaves out documents the user can't see, and fields they can't read", async () => {
    const author = await createDummyUser();
    const reader = await createDummyUser();
    const publishedPost = await createPostWithAdminOnlyFields(author);
    const draft = await createDummyPost(author, { draft: true });
    const readerContext = await computeContextFromUser({ user: reader, isSSR: false });

    const { postsById } = await loadMultipleEntitiesById(readerContext, {
      posts: [publishedPost._id, draft._id],
    });

    expect(postsById.has(draft._id)).toBe(false);
    expect(postsById.get(publishedPost._id)?.title).toBe(publishedPost.title);
    expect(postsById.get(publishedPost._id)?.userAgent).toBeUndefined();
    expect(postsById.get(publishedPost._id)?.referrer).toBeUndefined();
  });
});
