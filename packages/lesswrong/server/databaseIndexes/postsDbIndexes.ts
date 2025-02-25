import { combineIndexWithDefaultViewIndex } from "@/lib/collectionIndexUtils";
import { DatabaseIndexSet } from "../../lib/utils/databaseIndexSet";
import { filters, postStatuses } from "@/lib/collections/posts/constants";

function augmentForDefaultView(indexFields: MongoIndexKeyObj<DbPost>) {
  return combineIndexWithDefaultViewIndex({
    viewFields: indexFields,
    prefix: {status:1, isFuture:1, draft:1, unlisted:1, shortform: 1, hiddenRelatedQuestion:1, authorIsUnreviewed:1, groupId:1},
    suffix: { _id:1, meta:1, isEvent:1, af:1, frontpageDate:1, curatedDate:1, postedAt:1, baseScore:1 },
  });
}

export function getDbIndexesOnPosts() {
  const indexSet = new DatabaseIndexSet();

  // This index is currently unused on LW.
  // indexSet.add("Posts",
  //   augmentForDefaultView({ userId: 1, hideAuthor: 1, postedAt: -1, }),
  //   {
  //     name: "posts.userId_postedAt",
  //   }
  // );
  indexSet.addIndex("Posts",
    augmentForDefaultView({ 'coauthorStatuses.userId': 1, userId: 1, postedAt: -1 }),
    {
      name: "posts.coauthorStatuses_postedAt",
    }
  );

  indexSet.addIndex("Posts",
    augmentForDefaultView({ score:-1, isEvent: 1 }),
    {
      name: "posts.score",
    }
  );
  
  
  // Wildcard index on tagRelevance, enables us to efficiently filter on tagRel scores
  indexSet.addIndex("Posts",{ "tagRelevance.$**" : 1 } )
  // This index doesn't appear used, but seems like it should be.
  // indexSet.addIndex("Posts",
  //   augmentForDefaultView({ afSticky:-1, score:-1 }),
  //   {
  //     name: "posts.afSticky_score",
  //   }
  // );

  // unused on LW. If EA forum is also not using we can delete.
  // indexSet.addIndex("Posts",
  //   augmentForDefaultView({ ...stickiesIndexPrefix, baseScore:-1 }),
  //   {
  //     name: "posts.stickies_baseScore",
  //   }
  // );
  // indexSet.addIndex("Posts",
  //   augmentForDefaultView({ userId: 1, hideAuthor: 1, ...stickiesIndexPrefix, baseScore:-1 }),
  //   {
  //     name: "posts.userId_stickies_baseScore",
  //   }
  // );
  
  // Used by "topAdjusted" sort
  indexSet.addIndex("Posts",
    augmentForDefaultView({ postedAt: 1, baseScore: 1, maxBaseScore: 1 }),
    {
      name: "posts.sort_by_topAdjusted",
      partialFilterExpression: {
        status: postStatuses.STATUS_APPROVED,
        draft: false,
        unlisted: false,
        isFuture: false,
        shortform: false,
        authorIsUnreviewed: false,
        hiddenRelatedQuestion: false,
        isEvent: false,
      },
    }
  );
  
  indexSet.addIndex("Posts",
    augmentForDefaultView({ postedAt:1, baseScore:1}),
    {
      name: "posts.postedAt_baseScore",
    }
  );
  
  indexSet.addIndex("Posts",
    augmentForDefaultView({ sticky: -1, stickyPriority: -1, score: -1, frontpageDate:1 }),
    {
      name: "posts.frontpage",
      partialFilterExpression: filters.frontpage,
    }
  );
  indexSet.addIndex("Posts",
    augmentForDefaultView({ sticky:-1, curatedDate:-1, postedAt:-1 }),
    {
      name: "posts.curated",
      partialFilterExpression: { curatedDate: {$gt: new Date(0)} },
    }
  );
  indexSet.addIndex("Posts",
    augmentForDefaultView({ sticky: -1, score: -1 }),
    {
      name: "posts.community",
    }
  );
  indexSet.addIndex("Posts",
    augmentForDefaultView({ question:1, lastCommentedAt: -1 }),
    {
      name: "posts.topQuestions",
    }
  );
  indexSet.addIndex("Posts", augmentForDefaultView({ rejected: -1, authorIsUnreviewed:1, postedAt: -1 }));
  
  // not currently used, but seems like it should be?
  // indexSet.addIndex("Posts",
  //   augmentForDefaultView({ wordCount: 1, userId: 1, hideAuthor: 1, deletedDraft: 1, modifiedAt: -1, createdAt: -1 }),
  //   { name: "posts.userId_wordCount" }
  // );
  indexSet.addIndex("Posts",
    augmentForDefaultView({ userId: 1, hideAuthor: 1, deletedDraft: 1, modifiedAt: -1, createdAt: -1 }),
    { name: "posts.userId_createdAt" }
  );
  indexSet.addIndex("Posts",
    augmentForDefaultView({ shareWithUsers: 1, deletedDraft: 1, modifiedAt: -1, createdAt: -1 }),
    { name: "posts.userId_shareWithUsers" }
  );
  indexSet.addIndex("Posts", {"slug": "hashed"});
  indexSet.addIndex("Posts", {legacyId: "hashed"});
  
  // Corresponds to the postCommented subquery in recentDiscussionFeed.ts
  const postCommentedViewFields = {
    status: 1,
    isFuture: 1,
    draft: 1,
    unlisted: 1,
    authorIsUnreviewed: 1,
    hideFrontpageComments: 1,
    
    lastCommentedAt: -1,
    _id: 1,
    
    baseScore: 1,
    af: 1,
    isEvent: 1,
    globalEvent: 1,
    commentCount: 1,
  }
  indexSet.addIndex("Posts", postCommentedViewFields);
  indexSet.addIndex("Posts",
    augmentForDefaultView({ lastCommentedAt:-1, baseScore:1, hideFrontpageComments:1 }),
    { name: "posts.recentDiscussionThreadsList", }
  );
  
  // this index appears unused
  // indexSet.addIndex("Posts",
  //   augmentForDefaultView({ hideFrontpageComments:1, afLastCommentedAt:-1, baseScore:1 }),
  //   { name: "posts.afRecentDiscussionThreadsList", }
  // );
  
  // indexSet.addIndex("Posts",
  //   augmentForDefaultView({ nominationCount2018: 1, lastCommentedAt:-1, baseScore:1, hideFrontpageComments:1 }),
  //   { name: "posts.2018reviewRecentDiscussionThreadsList", }
  // );
  
  // indexSet.addIndex("Posts",
  //   augmentForDefaultView({ nominationCount2019: 1, lastCommentedAt:-1, baseScore:1, hideFrontpageComments:1 }),
  //   { name: "posts.2019reviewRecentDiscussionThreadsList", }
  // );
  
  indexSet.addIndex("Posts",
    augmentForDefaultView({ globalEvent:1, eventType:1, startTime:1, endTime:1 }),
    { name: "posts.globalEvents" }
  );
  
  indexSet.addIndex("Posts",
    augmentForDefaultView({ mongoLocation:"2dsphere", eventType:1, startTime:1, endTime: 1 }),
    { name: "posts.2dsphere" }
  );
  
  indexSet.addIndex("Posts",
    augmentForDefaultView({ globalEvent: 1, onlineEvent: 1, startTime:1, endTime: 1, createdAt:1, baseScore:1 }),
    { name: "posts.events" }
  );
  
  indexSet.addIndex("Posts",
    augmentForDefaultView({ bannedUserIds:1, createdAt: 1 }),
    { name: "posts.postsWithBannedUsers" }
  );
  
  indexSet.addIndex("Posts",
    augmentForDefaultView({ status:1, reviewedByUserId:1, frontpageDate: 1, authorIsUnreviewed:1, meta: 1 }),
    { name: "posts.sunshineNewPosts" }
  );
  
  indexSet.addIndex("Posts",
    augmentForDefaultView({ status:1, userId:1, hideAuthor: 1, reviewedByUserId:1, frontpageDate: 1, authorIsUnreviewed:1, createdAt: -1 }),
    { name: "posts.sunshineNewUsersPosts" }
  );
  
  indexSet.addIndex("Posts",
    augmentForDefaultView({ postedAt:1, reviewForCuratedUserId:1, suggestForCuratedUserIds:1, }),
    {
      name: "posts.sunshineCuratedSuggestions",
      partialFilterExpression: {suggestForCuratedUserIds: {$exists:true}},
    }
  );
  
  // Used in Posts.find() in various places
  indexSet.addIndex("Posts", {userId:1, createdAt:-1});
  
  // Used in routes
  indexSet.addIndex("Posts", {agentFoundationsId: "hashed"});
  
  // Used in checkScheduledPosts cronjob
  indexSet.addIndex("Posts", {isFuture:1, postedAt:1});
  
  // Used in scoring aggregate query
  indexSet.addIndex("Posts", {inactive:1,postedAt:1});
  
  // Used for recommendations
  indexSet.addIndex("Posts",
    augmentForDefaultView({ meta:1, disableRecommendation:1, baseScore:1, curatedDate:1, frontpageDate:1 }),
    { name: "posts.recommendable" }
  );
  
  indexSet.addIndex("Posts",
    augmentForDefaultView({ "pingbacks.Posts": 1, baseScore: 1 }),
    { name: "posts.pingbackPosts" }
  );
  indexSet.addCustomPgIndex(`CREATE INDEX IF NOT EXISTS idx_posts_pingbacks ON "Posts" USING gin(pingbacks);`);
  
  // indexSet.addIndex("Posts",
  //   augmentForDefaultView({ nominationCount2018:1 }),
  //   { name: "posts.nominations2018", }
  // );
  
  // indexSet.addIndex("Posts",
  //   augmentForDefaultView({ nominationCount2019:1 }),
  //   { name: "posts.nominations2019", }
  // );
  
  indexSet.addIndex("Posts",
    augmentForDefaultView({ _id: 1, userId: 1, isEvent:1, baseScore:1 }),
    { name: "posts.nominatablePostsByVote", }
  );
  
  indexSet.addIndex("Posts",
    augmentForDefaultView({ positiveReviewVoteCount: 1, tagRelevance: 1, createdAt: 1 }),
    { name: "posts.positiveReviewVoteCount", }
  );
  
  indexSet.addIndex("Posts",
    augmentForDefaultView({ positiveReviewVoteCount: 1, reviewCount: 1, createdAt: 1 }),
    { name: "posts.positiveReviewVoteCountReviewCount", }
  );
  
  /**
   * For preventing both `PostsRepo.getRecentlyActiveDialogues` and `PostsRepo.getMyActiveDialogues` from being seq scans on Posts.
   * Given the relatively small number of dialogues, `getMyActiveDialogues` still ends up being fast even though it needs to check each dialogue for userId/coauthorStatuses.
   * 
   * This also speeds up `UsersRepo.getUsersWhoHaveMadeDialogues` a bunch.
   */
  indexSet.addCustomPgIndex(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_Posts_max_postedAt_mostRecentPublishedDialogueResponseDate"
    ON "Posts" (GREATEST("postedAt", "mostRecentPublishedDialogueResponseDate") DESC)
    WHERE "collabEditorDialogue" IS TRUE;
  `);
  
  // Needed to speed up getPostsAndCommentsFromSubscriptions, which otherwise has a pretty slow nested loop when joining on Posts because of the "postedAt" filter
  indexSet.addIndex("Posts", { userId: 1, postedAt: 1 }, { concurrently: true });

  indexSet.addIndex("Posts", {url:1, postedAt:-1});
  indexSet.addIndex("Posts", {"fmCrosspost.foreignPostId":1, postedAt:-1});
  indexSet.addIndex("Posts", {defaultRecommendation: 1})

  return indexSet;
}
