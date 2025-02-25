import { combineIndexWithDefaultViewIndex } from "@/lib/collectionIndexUtils";
import { DatabaseIndexSet } from "../../lib/utils/databaseIndexSet";

function augmentForDefaultView(indexFields: MongoIndexKeyObj<DbComment>) {
  return combineIndexWithDefaultViewIndex({
    viewFields: indexFields,
    prefix: {},
    suffix: {authorIsUnreviewed: 1, deleted:1, deletedPublic:1, hideAuthor:1, userId:1, af:1, postedAt:1, debateResponse:1},
  });
}

export function getDbIndexesOnComments() {
  const indexSet = new DatabaseIndexSet();

  // Most common case: want to get all the comments on a post, filter fields and
  // `limit` affects it only minimally. Best handled by a hash index on `postId`.
  indexSet.addIndex("Comments", { postId: "hashed" });
  
  // For the user profile page
  indexSet.addIndex("Comments", { userId:1, postedAt:-1 });

  indexSet.addIndex("Comments", { parentCommentId: "hashed" });

  indexSet.addIndex("Comments",
    augmentForDefaultView({ postId:1, parentAnswerId:1, answer:1, deleted:1, baseScore:-1, postedAt:-1 }),
    { name: "comments.top_comments" }
  );
  
  indexSet.addIndex("Comments",
    augmentForDefaultView({ postId:1, parentAnswerId:1, answer:1, deleted:1, lastSubthreadActivity: -1, baseScore:-1, postedAt:-1 }),
    { name: "comments.recent_replies" }
  );
  
  indexSet.addIndex("Comments",
    augmentForDefaultView({ postId:1, parentAnswerId:1, answer:1, deleted:1, score:-1, postedAt:-1 }),
    { name: "comments.magic_comments" }
  );
  
  indexSet.addIndex("Comments",
    augmentForDefaultView({ postId:1, parentAnswerId:1, answer:1, deleted:1, afBaseScore:-1, postedAt:-1 }),
    { name: "comments.af_top_comments" }
  );
  
  indexSet.addIndex("Comments",
    augmentForDefaultView({ postId:1, parentAnswerId:1, answer:1, deleted:1, postedAt:-1 }),
    { name: "comments.new_comments" }
  );
  indexSet.addIndex("Comments", augmentForDefaultView({ userId: 1, isPinnedOnProfile: -1, postedAt: -1 }))
  indexSet.addIndex("Comments", augmentForDefaultView({ postedAt: -1 }));
  indexSet.addIndex("Comments", augmentForDefaultView({ rejected: -1, authorIsUnreviewed:1, postedAt: 1 }));
  indexSet.addIndex("Comments", {legacyId: "hashed"});
  
  // Used in scoring cron job
  indexSet.addIndex("Comments", {inactive:1,postedAt:1});
  
  indexSet.addIndex("Comments", augmentForDefaultView({userId:1, postedAt:1}));
  indexSet.addIndex("Comments", augmentForDefaultView({parentAnswerId:1, baseScore:-1}));
  
  // Used in moveToAnswers
  indexSet.addIndex("Comments", {topLevelCommentId:1});
  
  // Used in findCommentByLegacyAFId
  indexSet.addIndex("Comments", {agentFoundationsId:1});
  
  // Will be used for experimental shortform display on AllPosts page
  indexSet.addIndex("Comments", {shortform:1, topLevelCommentId: 1, lastSubthreadActivity:1, postedAt: 1, baseScore:1});
  
  // Will be used for experimental shortform display on AllPosts page
  indexSet.addIndex("Comments", { topLevelCommentId: 1, postedAt: 1, baseScore:1});
  
  // Filtering comments down to ones that include "nominated for Review" so further sort indexes not necessary
  indexSet.addIndex("Comments",
    augmentForDefaultView({ nominatedForReview: 1, userId: 1, postId: 1 }),
    { name: "comments.nominations2018" }
  );
  
  // Filtering comments down to ones that include "reviewing for review" so further sort indexes not necessary
  indexSet.addIndex("Comments",
    augmentForDefaultView({ reviewingForReview: 1, userId: 1, postId: 1 }),
    { name: "comments.reviews2018" }
  );
  indexSet.addIndex("Comments",
    augmentForDefaultView({tagId: 1}),
    { name: "comments.tagId" }
  );
  
  indexSet.addIndex("Comments", augmentForDefaultView({ topLevelCommentId: 1, tagCommentType: 1, tagId:1 }));
  
  indexSet.addIndex("Comments",
    augmentForDefaultView({moderatorHat: 1}),
    { name: "comments.moderatorHat" }
  );
  
  indexSet.addIndex("Comments", augmentForDefaultView({ forumEventId: 1, userId: 1, postedAt: -1 }));
  
  // For allowing `CommentsRepo.getPromotedCommentsOnPosts` to use an index-only scan, which is much faster than an index scan followed by pulling each comment from disk to get its "promotedAt".
  void indexSet.addCustomPgIndex(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_Comments_postId_promotedAt"
    ON "Comments" ("postId", "promotedAt")
    WHERE "promotedAt" IS NOT NULL;
  `);
  
  // For allowing `TagsRepo.getUserTopTags` to use an index-only scan, since given previous indexes it needed to pull all the comments to get their "postId".
  void indexSet.addCustomPgIndex(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_Comments_userId_postId_postedAt"
    ON "Comments" ("userId", "postId", "postedAt");
  `);
  
  // Exists for the sake of `CommentsRepo.getPopularComments`, which otherwise takes several seconds to run on a cold cache
  // Note that while it'll continue to use the index if you _increase_ the baseScore requirement above 15, it won't if you decrease it
  // The other conditions in the query could also have been included in the partial index requirements,
  // but they made a trivial difference so the added complexity (and lack of generalizability) didn't seem worth it
  void indexSet.addCustomPgIndex(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_popular_comments
    ON "Comments" ("postId", "baseScore" DESC, "postedAt" DESC)
    WHERE ("baseScore" >= 15)
  `);
  
  indexSet.addIndex("Comments",
    augmentForDefaultView({ reviewForAlignmentUserId:1, af:1, suggestForAlignmentUserIds:1, postedAt:1, }),
    {
      name: "comments.alignmentSuggestedComments",
      partialFilterExpression: { "suggestForAlignmentUserIds.0": {$exists:true} },
    }
  );

  indexSet.addIndex("Comments", { userId: 1, createdAt: 1 });

  return indexSet;
}
