/**
 * Generated on 2023-10-18T22:37:24.782Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * ***Diff too large to display***
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
// export const acceptsSchemaHash = "e1a0256be4f29b89da1777967e01519b";

const fillInNullWithDefaultCommands = `
  UPDATE "AdvisorRequests"
  SET
    "interestedInMetaculus" = COALESCE("interestedInMetaculus", false)
  WHERE
    "interestedInMetaculus" IS NULL;


  UPDATE "Books"
  SET
    "postIds" = COALESCE("postIds", '{}'::character varying(27)[]),
    "sequenceIds" = COALESCE("sequenceIds", '{}'::character varying(27)[])
  WHERE
    "postIds" IS NULL OR
    "sequenceIds" IS NULL;


  UPDATE "Collections"
  SET
    "noindex" = COALESCE("noindex", false)
  WHERE
    "noindex" IS NULL;


  UPDATE "Comments"
  SET
    "af" = COALESCE("af", false),
    "answer" = COALESCE("answer", false),
    "authorIsUnreviewed" = COALESCE("authorIsUnreviewed", false),
    "baseScore" = COALESCE("baseScore", 0),
    "deleted" = COALESCE("deleted", false),
    "deletedPublic" = COALESCE("deletedPublic", false),
    "descendentCount" = COALESCE("descendentCount", 0),
    "directChildrenCount" = COALESCE("directChildrenCount", 0),
    "hideAuthor" = COALESCE("hideAuthor", false),
    "isPinnedOnProfile" = COALESCE("isPinnedOnProfile", false),
    "legacy" = COALESCE("legacy", false),
    "legacyPoll" = COALESCE("legacyPoll", false),
    "moderatorHat" = COALESCE("moderatorHat", false),
    "rejected" = COALESCE("rejected", false),
    "relevantTagIds" = COALESCE("relevantTagIds", '{}'::character varying(27)[]),
    "retracted" = COALESCE("retracted", false),
    "score" = COALESCE("score", 0),
    "shortformFrontpage" = COALESCE("shortformFrontpage", true),
    "spam" = COALESCE("spam", false),
    "suggestForAlignmentUserIds" = COALESCE("suggestForAlignmentUserIds", '{}'::text[]),
    "tagCommentType" = COALESCE("tagCommentType", 'DISCUSSION'::text),
    "voteCount" = COALESCE("voteCount", 0)
  WHERE
    "af" IS NULL OR
    "answer" IS NULL OR
    "authorIsUnreviewed" IS NULL OR
    "baseScore" IS NULL OR
    "deleted" IS NULL OR
    "deletedPublic" IS NULL OR
    "descendentCount" IS NULL OR
    "directChildrenCount" IS NULL OR
    "hideAuthor" IS NULL OR
    "isPinnedOnProfile" IS NULL OR
    "legacy" IS NULL OR
    "legacyPoll" IS NULL OR
    "moderatorHat" IS NULL OR
    "rejected" IS NULL OR
    "relevantTagIds" IS NULL OR
    "retracted" IS NULL OR
    "score" IS NULL OR
    "shortformFrontpage" IS NULL OR
    "spam" IS NULL OR
    "suggestForAlignmentUserIds" IS NULL OR
    "tagCommentType" IS NULL OR
    "voteCount" IS NULL;


  UPDATE "Conversations"
  SET
    "archivedByIds" = COALESCE("archivedByIds", '{}'::character varying(27)[]),
    "messageCount" = COALESCE("messageCount", 0),
    "participantIds" = COALESCE("participantIds", '{}'::character varying(27)[])
  WHERE
    "archivedByIds" IS NULL OR
    "messageCount" IS NULL OR
    "participantIds" IS NULL;


  UPDATE "GardenCodes"
  SET
    "afOnly" = COALESCE("afOnly", false),
    "deleted" = COALESCE("deleted", false),
    "hidden" = COALESCE("hidden", false),
    "title" = COALESCE("title", 'Guest Day Pass'::text),
    "type" = COALESCE("type", 'public'::text)
  WHERE
    "afOnly" IS NULL OR
    "deleted" IS NULL OR
    "hidden" IS NULL OR
    "title" IS NULL OR
    "type" IS NULL;


  UPDATE "Localgroups"
  SET
    "deleted" = COALESCE("deleted", false),
    "inactive" = COALESCE("inactive", false),
    "isOnline" = COALESCE("isOnline", false),
    "organizerIds" = COALESCE("organizerIds", '{}'::character varying(27)[]),
    "types" = COALESCE("types", '{''LW''}'::text[])
  WHERE
    "deleted" IS NULL OR
    "inactive" IS NULL OR
    "isOnline" IS NULL OR
    "organizerIds" IS NULL OR
    "types" IS NULL;


  UPDATE "Messages"
  SET
    "noEmail" = COALESCE("noEmail", false)
  WHERE
    "noEmail" IS NULL;


  UPDATE "Migrations"
  SET
    "finished" = COALESCE("finished", false),
    "succeeded" = COALESCE("succeeded", false)
  WHERE
    "finished" IS NULL OR
    "succeeded" IS NULL;


  UPDATE "ModerationTemplates"
  SET
    "deleted" = COALESCE("deleted", false),
    "order" = COALESCE("order", 10)
  WHERE
    "deleted" IS NULL OR
    "order" IS NULL;


  UPDATE "Notifications"
  SET
    "deleted" = COALESCE("deleted", false),
    "emailed" = COALESCE("emailed", false),
    "viewed" = COALESCE("viewed", false),
    "waitingForBatch" = COALESCE("waitingForBatch", false)
  WHERE
    "deleted" IS NULL OR
    "emailed" IS NULL OR
    "viewed" IS NULL OR
    "waitingForBatch" IS NULL;


  UPDATE "Posts"
  SET
    "af" = COALESCE("af", false),
    "afCommentCount" = COALESCE("afCommentCount", 0),
    "afSticky" = COALESCE("afSticky", false),
    "authorIsUnreviewed" = COALESCE("authorIsUnreviewed", false),
    "baseScore" = COALESCE("baseScore", 0),
    "clickCount" = COALESCE("clickCount", 0),
    "collabEditorDialogue" = COALESCE("collabEditorDialogue", false),
    "commentCount" = COALESCE("commentCount", 0),
    "debate" = COALESCE("debate", false),
    "defaultRecommendation" = COALESCE("defaultRecommendation", false),
    "deletedDraft" = COALESCE("deletedDraft", false),
    "disableRecommendation" = COALESCE("disableRecommendation", false),
    "draft" = COALESCE("draft", false),
    "finalReviewVoteScoreAF" = COALESCE("finalReviewVoteScoreAF", 0),
    "finalReviewVoteScoreAllKarma" = COALESCE("finalReviewVoteScoreAllKarma", 0),
    "finalReviewVoteScoreHighKarma" = COALESCE("finalReviewVoteScoreHighKarma", 0),
    "finalReviewVotesAF" = COALESCE("finalReviewVotesAF", '{}'::double precision[]),
    "finalReviewVotesAllKarma" = COALESCE("finalReviewVotesAllKarma", '{}'::double precision[]),
    "finalReviewVotesHighKarma" = COALESCE("finalReviewVotesHighKarma", '{}'::double precision[]),
    "fmCrosspost" = COALESCE("fmCrosspost", '{"isCrosspost": false}'::jsonb),
    "forceAllowType3Audio" = COALESCE("forceAllowType3Audio", false),
    "globalEvent" = COALESCE("globalEvent", false),
    "hasCoauthorPermission" = COALESCE("hasCoauthorPermission", true),
    "hiddenRelatedQuestion" = COALESCE("hiddenRelatedQuestion", false),
    "hideAuthor" = COALESCE("hideAuthor", false),
    "hideCommentKarma" = COALESCE("hideCommentKarma", false),
    "hideFromPopularComments" = COALESCE("hideFromPopularComments", false),
    "hideFromRecentDiscussions" = COALESCE("hideFromRecentDiscussions", false),
    "hideFrontpageComments" = COALESCE("hideFrontpageComments", false),
    "isEvent" = COALESCE("isEvent", false),
    "legacy" = COALESCE("legacy", false),
    "legacySpam" = COALESCE("legacySpam", false),
    "meta" = COALESCE("meta", false),
    "metaSticky" = COALESCE("metaSticky", false),
    "nextDayReminderSent" = COALESCE("nextDayReminderSent", false),
    "noIndex" = COALESCE("noIndex", false),
    "nominationCount2018" = COALESCE("nominationCount2018", 0),
    "nominationCount2019" = COALESCE("nominationCount2019", 0),
    "onlineEvent" = COALESCE("onlineEvent", false),
    "onlyVisibleToEstablishedAccounts" = COALESCE("onlyVisibleToEstablishedAccounts", false),
    "onlyVisibleToLoggedIn" = COALESCE("onlyVisibleToLoggedIn", false),
    "organizerIds" = COALESCE("organizerIds", '{}'::character varying(27)[]),
    "positiveReviewVoteCount" = COALESCE("positiveReviewVoteCount", 0),
    "postCategory" = COALESCE("postCategory", 'post'::text),
    "question" = COALESCE("question", false),
    "rejected" = COALESCE("rejected", false),
    "reviewCount" = COALESCE("reviewCount", 0),
    "reviewCount2018" = COALESCE("reviewCount2018", 0),
    "reviewCount2019" = COALESCE("reviewCount2019", 0),
    "reviewVoteCount" = COALESCE("reviewVoteCount", 0),
    "reviewVoteScoreAF" = COALESCE("reviewVoteScoreAF", 0),
    "reviewVoteScoreAllKarma" = COALESCE("reviewVoteScoreAllKarma", 0),
    "reviewVoteScoreHighKarma" = COALESCE("reviewVoteScoreHighKarma", 0),
    "reviewVotesAF" = COALESCE("reviewVotesAF", '{}'::double precision[]),
    "reviewVotesAllKarma" = COALESCE("reviewVotesAllKarma", '{}'::double precision[]),
    "reviewVotesHighKarma" = COALESCE("reviewVotesHighKarma", '{}'::double precision[]),
    "score" = COALESCE("score", 0),
    "shareWithUsers" = COALESCE("shareWithUsers", '{}'::character varying(27)[]),
    "shortform" = COALESCE("shortform", false),
    "sticky" = COALESCE("sticky", false),
    "stickyPriority" = COALESCE("stickyPriority", 2),
    "submitToFrontpage" = COALESCE("submitToFrontpage", true),
    "suggestForAlignmentUserIds" = COALESCE("suggestForAlignmentUserIds", '{}'::text[]),
    "topLevelCommentCount" = COALESCE("topLevelCommentCount", 0),
    "unlisted" = COALESCE("unlisted", false),
    "viewCount" = COALESCE("viewCount", 0),
    "voteCount" = COALESCE("voteCount", 0)
  WHERE
    "af" IS NULL OR
    "afCommentCount" IS NULL OR
    "afSticky" IS NULL OR
    "authorIsUnreviewed" IS NULL OR
    "baseScore" IS NULL OR
    "clickCount" IS NULL OR
    "collabEditorDialogue" IS NULL OR
    "commentCount" IS NULL OR
    "debate" IS NULL OR
    "defaultRecommendation" IS NULL OR
    "deletedDraft" IS NULL OR
    "disableRecommendation" IS NULL OR
    "draft" IS NULL OR
    "finalReviewVoteScoreAF" IS NULL OR
    "finalReviewVoteScoreAllKarma" IS NULL OR
    "finalReviewVoteScoreHighKarma" IS NULL OR
    "finalReviewVotesAF" IS NULL OR
    "finalReviewVotesAllKarma" IS NULL OR
    "finalReviewVotesHighKarma" IS NULL OR
    "fmCrosspost" IS NULL OR
    "forceAllowType3Audio" IS NULL OR
    "globalEvent" IS NULL OR
    "hasCoauthorPermission" IS NULL OR
    "hiddenRelatedQuestion" IS NULL OR
    "hideAuthor" IS NULL OR
    "hideCommentKarma" IS NULL OR
    "hideFromPopularComments" IS NULL OR
    "hideFromRecentDiscussions" IS NULL OR
    "hideFrontpageComments" IS NULL OR
    "isEvent" IS NULL OR
    "legacy" IS NULL OR
    "legacySpam" IS NULL OR
    "meta" IS NULL OR
    "metaSticky" IS NULL OR
    "nextDayReminderSent" IS NULL OR
    "noIndex" IS NULL OR
    "nominationCount2018" IS NULL OR
    "nominationCount2019" IS NULL OR
    "onlineEvent" IS NULL OR
    "onlyVisibleToEstablishedAccounts" IS NULL OR
    "onlyVisibleToLoggedIn" IS NULL OR
    "organizerIds" IS NULL OR
    "positiveReviewVoteCount" IS NULL OR
    "postCategory" IS NULL OR
    "question" IS NULL OR
    "rejected" IS NULL OR
    "reviewCount" IS NULL OR
    "reviewCount2018" IS NULL OR
    "reviewCount2019" IS NULL OR
    "reviewVoteCount" IS NULL OR
    "reviewVoteScoreAF" IS NULL OR
    "reviewVoteScoreAllKarma" IS NULL OR
    "reviewVoteScoreHighKarma" IS NULL OR
    "reviewVotesAF" IS NULL OR
    "reviewVotesAllKarma" IS NULL OR
    "reviewVotesHighKarma" IS NULL OR
    "score" IS NULL OR
    "shareWithUsers" IS NULL OR
    "shortform" IS NULL OR
    "sticky" IS NULL OR
    "stickyPriority" IS NULL OR
    "submitToFrontpage" IS NULL OR
    "suggestForAlignmentUserIds" IS NULL OR
    "topLevelCommentCount" IS NULL OR
    "unlisted" IS NULL OR
    "viewCount" IS NULL OR
    "voteCount" IS NULL;


  UPDATE "RSSFeeds"
  SET
    "displayFullContent" = COALESCE("displayFullContent", false),
    "importAsDraft" = COALESCE("importAsDraft", false),
    "ownedByUser" = COALESCE("ownedByUser", false),
    "setCanonicalUrl" = COALESCE("setCanonicalUrl", false)
  WHERE
    "displayFullContent" IS NULL OR
    "importAsDraft" IS NULL OR
    "ownedByUser" IS NULL OR
    "setCanonicalUrl" IS NULL;


  UPDATE "ReviewVotes"
  SET
    "dummy" = COALESCE("dummy", false),
    "quadraticScore" = COALESCE("quadraticScore", 0),
    "qualitativeScore" = COALESCE("qualitativeScore", 4),
    "year" = COALESCE("year", '2018'::text)
  WHERE
    "dummy" IS NULL OR
    "quadraticScore" IS NULL OR
    "qualitativeScore" IS NULL OR
    "year" IS NULL;


  UPDATE "Revisions"
  SET
    "baseScore" = COALESCE("baseScore", 0),
    "score" = COALESCE("score", 0),
    "voteCount" = COALESCE("voteCount", 0)
  WHERE
    "baseScore" IS NULL OR
    "score" IS NULL OR
    "voteCount" IS NULL;


  UPDATE "Sequences"
  SET
    "af" = COALESCE("af", false),
    "draft" = COALESCE("draft", false),
    "hidden" = COALESCE("hidden", false),
    "hideFromAuthorPage" = COALESCE("hideFromAuthorPage", false),
    "isDeleted" = COALESCE("isDeleted", false),
    "noindex" = COALESCE("noindex", false)
  WHERE
    "af" IS NULL OR
    "draft" IS NULL OR
    "hidden" IS NULL OR
    "hideFromAuthorPage" IS NULL OR
    "isDeleted" IS NULL OR
    "noindex" IS NULL;


  UPDATE "Spotlights"
  SET
    "documentType" = COALESCE("documentType", 'Sequence'::text),
    "draft" = COALESCE("draft", true),
    "duration" = COALESCE("duration", 3),
    "lastPromotedAt" = COALESCE("lastPromotedAt", '1970-01-01 00:00:00+00'::timestamp with time zone)
  WHERE
    "documentType" IS NULL OR
    "draft" IS NULL OR
    "duration" IS NULL OR
    "lastPromotedAt" IS NULL;


  UPDATE "Subscriptions"
  SET
    "deleted" = COALESCE("deleted", false)
  WHERE
    "deleted" IS NULL;


  UPDATE "TagFlags"
  SET
    "deleted" = COALESCE("deleted", false)
  WHERE
    "deleted" IS NULL;


  UPDATE "TagRels"
  SET
    "backfilled" = COALESCE("backfilled", false),
    "baseScore" = COALESCE("baseScore", 0),
    "deleted" = COALESCE("deleted", false),
    "score" = COALESCE("score", 0),
    "voteCount" = COALESCE("voteCount", 0)
  WHERE
    "backfilled" IS NULL OR
    "baseScore" IS NULL OR
    "deleted" IS NULL OR
    "score" IS NULL OR
    "voteCount" IS NULL;


  UPDATE "Tags"
  SET
    "adminOnly" = COALESCE("adminOnly", false),
    "core" = COALESCE("core", false),
    "defaultOrder" = COALESCE("defaultOrder", 0),
    "deleted" = COALESCE("deleted", false),
    "isPostType" = COALESCE("isPostType", false),
    "isSubforum" = COALESCE("isSubforum", false),
    "noindex" = COALESCE("noindex", false),
    "postCount" = COALESCE("postCount", 0),
    "subTagIds" = COALESCE("subTagIds", '{}'::character varying(27)[]),
    "subforumModeratorIds" = COALESCE("subforumModeratorIds", '{}'::character varying(27)[]),
    "suggestedAsFilter" = COALESCE("suggestedAsFilter", false),
    "tagFlagsIds" = COALESCE("tagFlagsIds", '{}'::character varying(27)[]),
    "wikiGrade" = COALESCE("wikiGrade", 2),
    "wikiOnly" = COALESCE("wikiOnly", false)
  WHERE
    "adminOnly" IS NULL OR
    "core" IS NULL OR
    "defaultOrder" IS NULL OR
    "deleted" IS NULL OR
    "isPostType" IS NULL OR
    "isSubforum" IS NULL OR
    "noindex" IS NULL OR
    "postCount" IS NULL OR
    "subTagIds" IS NULL OR
    "subforumModeratorIds" IS NULL OR
    "suggestedAsFilter" IS NULL OR
    "tagFlagsIds" IS NULL OR
    "wikiGrade" IS NULL OR
    "wikiOnly" IS NULL;


  UPDATE "UserMostValuablePosts"
  SET
    "deleted" = COALESCE("deleted", false)
  WHERE
    "deleted" IS NULL;


  UPDATE "UserTagRels"
  SET
    "subforumHideIntroPost" = COALESCE("subforumHideIntroPost", false)
  WHERE
    "subforumHideIntroPost" IS NULL;


  UPDATE "Users"
  SET
    "acceptedTos" = COALESCE("acceptedTos", false),
    "afCommentCount" = COALESCE("afCommentCount", 0),
    "afKarma" = COALESCE("afKarma", 0),
    "afPostCount" = COALESCE("afPostCount", 0),
    "afSequenceCount" = COALESCE("afSequenceCount", 0),
    "afSequenceDraftCount" = COALESCE("afSequenceDraftCount", 0),
    "allowDatadogSessionReplay" = COALESCE("allowDatadogSessionReplay", false),
    "autoSubscribeAsOrganizer" = COALESCE("autoSubscribeAsOrganizer", true),
    "auto_subscribe_to_my_comments" = COALESCE("auto_subscribe_to_my_comments", true),
    "auto_subscribe_to_my_posts" = COALESCE("auto_subscribe_to_my_posts", true),
    "bookmarkedPostsMetadata" = COALESCE("bookmarkedPostsMetadata", '{}'::jsonb[]),
    "commentCount" = COALESCE("commentCount", 0),
    "deleted" = COALESCE("deleted", false),
    "frontpagePostCount" = COALESCE("frontpagePostCount", 0),
    "hiddenPostsMetadata" = COALESCE("hiddenPostsMetadata", '{}'::jsonb[]),
    "hideAFNonMemberInitialWarning" = COALESCE("hideAFNonMemberInitialWarning", false),
    "hideCommunitySection" = COALESCE("hideCommunitySection", false),
    "hideElicitPredictions" = COALESCE("hideElicitPredictions", false),
    "hideHomeRHS" = COALESCE("hideHomeRHS", false),
    "hideIntercom" = COALESCE("hideIntercom", false),
    "hideMeetupsPoke" = COALESCE("hideMeetupsPoke", false),
    "hidePostsRecommendations" = COALESCE("hidePostsRecommendations", false),
    "hideSubscribePoke" = COALESCE("hideSubscribePoke", false),
    "karmaChangeNotifierSettings" = COALESCE("karmaChangeNotifierSettings", '{"dayOfWeekGMT": "Saturday", "timeOfDayGMT": 11, "updateFrequency": "daily", "showNegativeKarma": false}'::jsonb),
    "legacy" = COALESCE("legacy", false),
    "markDownPostEditor" = COALESCE("markDownPostEditor", false),
    "maxCommentCount" = COALESCE("maxCommentCount", 0),
    "maxPostCount" = COALESCE("maxPostCount", 0),
    "nearbyEventsNotifications" = COALESCE("nearbyEventsNotifications", false),
    "needsReview" = COALESCE("needsReview", false),
    "noCollapseCommentsFrontpage" = COALESCE("noCollapseCommentsFrontpage", false),
    "noCollapseCommentsPosts" = COALESCE("noCollapseCommentsPosts", false),
    "noExpandUnreadCommentsReview" = COALESCE("noExpandUnreadCommentsReview", false),
    "noSingleLineComments" = COALESCE("noSingleLineComments", false),
    "noindex" = COALESCE("noindex", false),
    "notificationAlignmentSubmissionApproved" = COALESCE("notificationAlignmentSubmissionApproved", '{"channel": "both", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationCommentsOnDraft" = COALESCE("notificationCommentsOnDraft", '{"channel": "both", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationCommentsOnSubscribedPost" = COALESCE("notificationCommentsOnSubscribedPost", '{"channel": "onsite", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationDebateCommentsOnSubscribedPost" = COALESCE("notificationDebateCommentsOnSubscribedPost", '{"channel": "onsite", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "daily"}'::jsonb),
    "notificationDebateReplies" = COALESCE("notificationDebateReplies", '{"channel": "onsite", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationDialogueMessages" = COALESCE("notificationDialogueMessages", '{"channel": "both", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationEventInRadius" = COALESCE("notificationEventInRadius", '{"channel": "both", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationGroupAdministration" = COALESCE("notificationGroupAdministration", '{"channel": "both", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationNewMention" = COALESCE("notificationNewMention", '{"channel": "onsite", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationPostsInGroups" = COALESCE("notificationPostsInGroups", '{"channel": "both", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationPostsNominatedReview" = COALESCE("notificationPostsNominatedReview", '{"channel": "both", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationPrivateMessage" = COALESCE("notificationPrivateMessage", '{"channel": "both", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationPublishedDialogueMessages" = COALESCE("notificationPublishedDialogueMessages", '{"channel": "onsite", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationRSVPs" = COALESCE("notificationRSVPs", '{"channel": "both", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationRepliesToMyComments" = COALESCE("notificationRepliesToMyComments", '{"channel": "onsite", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationRepliesToSubscribedComments" = COALESCE("notificationRepliesToSubscribedComments", '{"channel": "onsite", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationSharedWithMe" = COALESCE("notificationSharedWithMe", '{"channel": "both", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationShortformContent" = COALESCE("notificationShortformContent", '{"channel": "onsite", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationSubforumUnread" = COALESCE("notificationSubforumUnread", '{"channel": "onsite", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "daily"}'::jsonb),
    "notificationSubscribedTagPost" = COALESCE("notificationSubscribedTagPost", '{"channel": "onsite", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "notificationSubscribedUserPost" = COALESCE("notificationSubscribedUserPost", '{"channel": "onsite", "dayOfWeekGMT": "Monday", "timeOfDayGMT": 12, "batchingFrequency": "realtime"}'::jsonb),
    "organizerOfGroupIds" = COALESCE("organizerOfGroupIds", '{}'::character varying(27)[]),
    "petrovOptOut" = COALESCE("petrovOptOut", false),
    "postCount" = COALESCE("postCount", 0),
    "profileTagIds" = COALESCE("profileTagIds", '{}'::character varying(27)[]),
    "reactPaletteStyle" = COALESCE("reactPaletteStyle", 'listView'::text),
    "sequenceCount" = COALESCE("sequenceCount", 0),
    "sequenceDraftCount" = COALESCE("sequenceDraftCount", 0),
    "showCommunityInRecentDiscussion" = COALESCE("showCommunityInRecentDiscussion", false),
    "subscribedToDigest" = COALESCE("subscribedToDigest", false),
    "sunshineFlagged" = COALESCE("sunshineFlagged", false),
    "sunshineNotes" = COALESCE("sunshineNotes", ''::text),
    "sunshineSnoozed" = COALESCE("sunshineSnoozed", false),
    "tagRevisionCount" = COALESCE("tagRevisionCount", 0),
    "theme" = COALESCE("theme", '{"name": "default"}'::jsonb),
    "usernameUnset" = COALESCE("usernameUnset", false)
  WHERE
    "acceptedTos" IS NULL OR
    "afCommentCount" IS NULL OR
    "afKarma" IS NULL OR
    "afPostCount" IS NULL OR
    "afSequenceCount" IS NULL OR
    "afSequenceDraftCount" IS NULL OR
    "allowDatadogSessionReplay" IS NULL OR
    "autoSubscribeAsOrganizer" IS NULL OR
    "auto_subscribe_to_my_comments" IS NULL OR
    "auto_subscribe_to_my_posts" IS NULL OR
    "bookmarkedPostsMetadata" IS NULL OR
    "commentCount" IS NULL OR
    "deleted" IS NULL OR
    "frontpagePostCount" IS NULL OR
    "hiddenPostsMetadata" IS NULL OR
    "hideAFNonMemberInitialWarning" IS NULL OR
    "hideCommunitySection" IS NULL OR
    "hideElicitPredictions" IS NULL OR
    "hideHomeRHS" IS NULL OR
    "hideIntercom" IS NULL OR
    "hideMeetupsPoke" IS NULL OR
    "hidePostsRecommendations" IS NULL OR
    "hideSubscribePoke" IS NULL OR
    "karmaChangeNotifierSettings" IS NULL OR
    "legacy" IS NULL OR
    "markDownPostEditor" IS NULL OR
    "maxCommentCount" IS NULL OR
    "maxPostCount" IS NULL OR
    "nearbyEventsNotifications" IS NULL OR
    "needsReview" IS NULL OR
    "noCollapseCommentsFrontpage" IS NULL OR
    "noCollapseCommentsPosts" IS NULL OR
    "noExpandUnreadCommentsReview" IS NULL OR
    "noSingleLineComments" IS NULL OR
    "noindex" IS NULL OR
    "notificationAlignmentSubmissionApproved" IS NULL OR
    "notificationCommentsOnDraft" IS NULL OR
    "notificationCommentsOnSubscribedPost" IS NULL OR
    "notificationDebateCommentsOnSubscribedPost" IS NULL OR
    "notificationDebateReplies" IS NULL OR
    "notificationDialogueMessages" IS NULL OR
    "notificationEventInRadius" IS NULL OR
    "notificationGroupAdministration" IS NULL OR
    "notificationNewMention" IS NULL OR
    "notificationPostsInGroups" IS NULL OR
    "notificationPostsNominatedReview" IS NULL OR
    "notificationPrivateMessage" IS NULL OR
    "notificationPublishedDialogueMessages" IS NULL OR
    "notificationRSVPs" IS NULL OR
    "notificationRepliesToMyComments" IS NULL OR
    "notificationRepliesToSubscribedComments" IS NULL OR
    "notificationSharedWithMe" IS NULL OR
    "notificationShortformContent" IS NULL OR
    "notificationSubforumUnread" IS NULL OR
    "notificationSubscribedTagPost" IS NULL OR
    "notificationSubscribedUserPost" IS NULL OR
    "organizerOfGroupIds" IS NULL OR
    "petrovOptOut" IS NULL OR
    "postCount" IS NULL OR
    "profileTagIds" IS NULL OR
    "reactPaletteStyle" IS NULL OR
    "sequenceCount" IS NULL OR
    "sequenceDraftCount" IS NULL OR
    "showCommunityInRecentDiscussion" IS NULL OR
    "subscribedToDigest" IS NULL OR
    "sunshineFlagged" IS NULL OR
    "sunshineNotes" IS NULL OR
    "sunshineSnoozed" IS NULL OR
    "tagRevisionCount" IS NULL OR
    "theme" IS NULL OR
    "usernameUnset" IS NULL;


  UPDATE "Votes"
  SET
    "cancelled" = COALESCE("cancelled", false),
    "documentIsAf" = COALESCE("documentIsAf", false),
    "isUnvote" = COALESCE("isUnvote", false)
  WHERE
    "cancelled" IS NULL OR
    "documentIsAf" IS NULL OR
    "isUnvote" IS NULL;
  `

const setNotnullCommands = `
  ALTER TABLE "AdvisorRequests"
    ALTER COLUMN "interestedInMetaculus" SET NOT NULL,
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "jobAds" SET NOT NULL;


  ALTER TABLE "Books"
    ALTER COLUMN "postIds" SET NOT NULL,
    ALTER COLUMN "sequenceIds" SET NOT NULL;


  ALTER TABLE "Collections"
    ALTER COLUMN "noindex" SET NOT NULL,
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "firstPageLink" SET NOT NULL,


  ALTER TABLE "Comments"
    ALTER COLUMN "af" SET NOT NULL,
    ALTER COLUMN "answer" SET NOT NULL,
    ALTER COLUMN "authorIsUnreviewed" SET NOT NULL,
    ALTER COLUMN "baseScore" SET NOT NULL,
    ALTER COLUMN "deleted" SET NOT NULL,
    ALTER COLUMN "deletedPublic" SET NOT NULL,
    ALTER COLUMN "descendentCount" SET NOT NULL,
    ALTER COLUMN "directChildrenCount" SET NOT NULL,
    ALTER COLUMN "hideAuthor" SET NOT NULL,
    ALTER COLUMN "isPinnedOnProfile" SET NOT NULL,
    ALTER COLUMN "legacy" SET NOT NULL,
    ALTER COLUMN "legacyPoll" SET NOT NULL,
    ALTER COLUMN "moderatorHat" SET NOT NULL,
    ALTER COLUMN "rejected" SET NOT NULL,
    ALTER COLUMN "relevantTagIds" SET NOT NULL,
    ALTER COLUMN "retracted" SET NOT NULL,
    ALTER COLUMN "score" SET NOT NULL,
    ALTER COLUMN "shortformFrontpage" SET NOT NULL,
    ALTER COLUMN "spam" SET NOT NULL,
    ALTER COLUMN "suggestForAlignmentUserIds" SET NOT NULL,
    ALTER COLUMN "tagCommentType" SET NOT NULL,
    ALTER COLUMN "voteCount" SET NOT NULL,
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "postedAt" SET NOT NULL,
    ALTER COLUMN "inactive" SET NOT NULL;


  ALTER TABLE "Conversations"
    ALTER COLUMN "archivedByIds" SET NOT NULL,
    ALTER COLUMN "messageCount" SET NOT NULL,
    ALTER COLUMN "participantIds" SET NOT NULL;


  ALTER TABLE "GardenCodes"
    ALTER COLUMN "afOnly" SET NOT NULL,
    ALTER COLUMN "deleted" SET NOT NULL,
    ALTER COLUMN "hidden" SET NOT NULL,
    ALTER COLUMN "title" SET NOT NULL,
    ALTER COLUMN "type" SET NOT NULL,
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "slug" SET NOT NULL,
    ALTER COLUMN "endTime" SET NOT NULL,
    ALTER COLUMN "code" SET NOT NULL;


  ALTER TABLE "Localgroups"
    ALTER COLUMN "deleted" SET NOT NULL,
    ALTER COLUMN "inactive" SET NOT NULL,
    ALTER COLUMN "isOnline" SET NOT NULL,
    ALTER COLUMN "organizerIds" SET NOT NULL,
    ALTER COLUMN "types" SET NOT NULL,
    ALTER COLUMN "name" SET NOT NULL,
    ALTER COLUMN "lastActivity" SET NOT NULL;


  ALTER TABLE "Messages"
    ALTER COLUMN "noEmail" SET NOT NULL,
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "conversationId" SET NOT NULL,


  ALTER TABLE "Migrations"
    ALTER COLUMN "finished" SET NOT NULL,
    ALTER COLUMN "succeeded" SET NOT NULL,
    ALTER COLUMN "started" SET NOT NULL,
    ALTER COLUMN "name" SET NOT NULL;


  ALTER TABLE "ModerationTemplates"
    ALTER COLUMN "deleted" SET NOT NULL,
    ALTER COLUMN "order" SET NOT NULL,
    ALTER COLUMN "name" SET NOT NULL,
    ALTER COLUMN "collectionName" SET NOT NULL;


  ALTER TABLE "Notifications"
    ALTER COLUMN "deleted" SET NOT NULL,
    ALTER COLUMN "emailed" SET NOT NULL,
    ALTER COLUMN "viewed" SET NOT NULL,
    ALTER COLUMN "waitingForBatch" SET NOT NULL,
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "type" SET NOT NULL,
    ALTER COLUMN "message" SET NOT NULL;


  ALTER TABLE "Posts"
    ALTER COLUMN "af" SET NOT NULL,
    ALTER COLUMN "afCommentCount" SET NOT NULL,
    ALTER COLUMN "afSticky" SET NOT NULL,
    ALTER COLUMN "authorIsUnreviewed" SET NOT NULL,
    ALTER COLUMN "baseScore" SET NOT NULL,
    ALTER COLUMN "clickCount" SET NOT NULL,
    ALTER COLUMN "collabEditorDialogue" SET NOT NULL,
    ALTER COLUMN "commentCount" SET NOT NULL,
    ALTER COLUMN "debate" SET NOT NULL,
    ALTER COLUMN "defaultRecommendation" SET NOT NULL,
    ALTER COLUMN "deletedDraft" SET NOT NULL,
    ALTER COLUMN "disableRecommendation" SET NOT NULL,
    ALTER COLUMN "draft" SET NOT NULL,
    ALTER COLUMN "finalReviewVoteScoreAF" SET NOT NULL,
    ALTER COLUMN "finalReviewVoteScoreAllKarma" SET NOT NULL,
    ALTER COLUMN "finalReviewVoteScoreHighKarma" SET NOT NULL,
    ALTER COLUMN "finalReviewVotesAF" SET NOT NULL,
    ALTER COLUMN "finalReviewVotesAllKarma" SET NOT NULL,
    ALTER COLUMN "finalReviewVotesHighKarma" SET NOT NULL,
    ALTER COLUMN "fmCrosspost" SET NOT NULL,
    ALTER COLUMN "forceAllowType3Audio" SET NOT NULL,
    ALTER COLUMN "globalEvent" SET NOT NULL,
    ALTER COLUMN "hasCoauthorPermission" SET NOT NULL,
    ALTER COLUMN "hiddenRelatedQuestion" SET NOT NULL,
    ALTER COLUMN "hideAuthor" SET NOT NULL,
    ALTER COLUMN "hideCommentKarma" SET NOT NULL,
    ALTER COLUMN "hideFromPopularComments" SET NOT NULL,
    ALTER COLUMN "hideFromRecentDiscussions" SET NOT NULL,
    ALTER COLUMN "hideFrontpageComments" SET NOT NULL,
    ALTER COLUMN "isEvent" SET NOT NULL,
    ALTER COLUMN "legacy" SET NOT NULL,
    ALTER COLUMN "legacySpam" SET NOT NULL,
    ALTER COLUMN "meta" SET NOT NULL,
    ALTER COLUMN "metaSticky" SET NOT NULL,
    ALTER COLUMN "nextDayReminderSent" SET NOT NULL,
    ALTER COLUMN "noIndex" SET NOT NULL,
    ALTER COLUMN "nominationCount2018" SET NOT NULL,
    ALTER COLUMN "nominationCount2019" SET NOT NULL,
    ALTER COLUMN "onlineEvent" SET NOT NULL,
    ALTER COLUMN "onlyVisibleToEstablishedAccounts" SET NOT NULL,
    ALTER COLUMN "onlyVisibleToLoggedIn" SET NOT NULL,
    ALTER COLUMN "organizerIds" SET NOT NULL,
    ALTER COLUMN "positiveReviewVoteCount" SET NOT NULL,
    ALTER COLUMN "postCategory" SET NOT NULL,
    ALTER COLUMN "question" SET NOT NULL,
    ALTER COLUMN "rejected" SET NOT NULL,
    ALTER COLUMN "reviewCount" SET NOT NULL,
    ALTER COLUMN "reviewCount2018" SET NOT NULL,
    ALTER COLUMN "reviewCount2019" SET NOT NULL,
    ALTER COLUMN "reviewVoteCount" SET NOT NULL,
    ALTER COLUMN "reviewVoteScoreAF" SET NOT NULL,
    ALTER COLUMN "reviewVoteScoreAllKarma" SET NOT NULL,
    ALTER COLUMN "reviewVoteScoreHighKarma" SET NOT NULL,
    ALTER COLUMN "reviewVotesAF" SET NOT NULL,
    ALTER COLUMN "reviewVotesAllKarma" SET NOT NULL,
    ALTER COLUMN "reviewVotesHighKarma" SET NOT NULL,
    ALTER COLUMN "score" SET NOT NULL,
    ALTER COLUMN "shareWithUsers" SET NOT NULL,
    ALTER COLUMN "shortform" SET NOT NULL,
    ALTER COLUMN "sticky" SET NOT NULL,
    ALTER COLUMN "stickyPriority" SET NOT NULL,
    ALTER COLUMN "submitToFrontpage" SET NOT NULL,
    ALTER COLUMN "suggestForAlignmentUserIds" SET NOT NULL,
    ALTER COLUMN "topLevelCommentCount" SET NOT NULL,
    ALTER COLUMN "unlisted" SET NOT NULL,
    ALTER COLUMN "viewCount" SET NOT NULL,
    ALTER COLUMN "voteCount" SET NOT NULL,
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "status" SET NOT NULL,
    ALTER COLUMN "slug" SET NOT NULL,
    ALTER COLUMN "postedAt" SET NOT NULL,
    ALTER COLUMN "maxBaseScore" SET NOT NULL,
    ALTER COLUMN "isFuture" SET NOT NULL,
    ALTER COLUMN "inactive" SET NOT NULL;


  ALTER TABLE "RSSFeeds"
    ALTER COLUMN "displayFullContent" SET NOT NULL,
    ALTER COLUMN "importAsDraft" SET NOT NULL,
    ALTER COLUMN "ownedByUser" SET NOT NULL,
    ALTER COLUMN "setCanonicalUrl" SET NOT NULL,
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "url" SET NOT NULL,
    ALTER COLUMN "rawFeed" SET NOT NULL,
    ALTER COLUMN "nickname" SET NOT NULL;


  ALTER TABLE "ReviewVotes"
    ALTER COLUMN "dummy" SET NOT NULL,
    ALTER COLUMN "quadraticScore" SET NOT NULL,
    ALTER COLUMN "qualitativeScore" SET NOT NULL,
    ALTER COLUMN "year" SET NOT NULL,
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "postId" SET NOT NULL;


  ALTER TABLE "Revisions"
    ALTER COLUMN "baseScore" SET NOT NULL,
    ALTER COLUMN "score" SET NOT NULL,
    ALTER COLUMN "voteCount" SET NOT NULL,
    ALTER COLUMN "wordCount" SET NOT NULL,
    ALTER COLUMN "version" SET NOT NULL,
    ALTER COLUMN "originalContents" SET NOT NULL,
    ALTER COLUMN "changeMetrics" SET NOT NULL;


  ALTER TABLE "Sequences"
    ALTER COLUMN "af" SET NOT NULL,
    ALTER COLUMN "draft" SET NOT NULL,
    ALTER COLUMN "hidden" SET NOT NULL,
    ALTER COLUMN "hideFromAuthorPage" SET NOT NULL,
    ALTER COLUMN "isDeleted" SET NOT NULL,
    ALTER COLUMN "noindex" SET NOT NULL,
    ALTER COLUMN "userId" SET NOT NULL;


  ALTER TABLE "Spotlights"
    ALTER COLUMN "documentType" SET NOT NULL,
    ALTER COLUMN "draft" SET NOT NULL,
    ALTER COLUMN "duration" SET NOT NULL,
    ALTER COLUMN "lastPromotedAt" SET NOT NULL,
    ALTER COLUMN "position" SET NOT NULL,
    ALTER COLUMN "documentId" SET NOT NULL,
    ALTER COLUMN "description_latest" SET NOT NULL,
    ALTER COLUMN "description" SET NOT NULL;


  ALTER TABLE "Subscriptions"
    ALTER COLUMN "deleted" SET NOT NULL,
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "type" SET NOT NULL,
    ALTER COLUMN "state" SET NOT NULL,
    ALTER COLUMN "collectionName" SET NOT NULL;


  ALTER TABLE "TagFlags"
    ALTER COLUMN "deleted" SET NOT NULL,
    ALTER COLUMN "slug" SET NOT NULL,
    ALTER COLUMN "order" SET NOT NULL,
    ALTER COLUMN "name" SET NOT NULL,


  ALTER TABLE "TagRels"
    ALTER COLUMN "backfilled" SET NOT NULL,
    ALTER COLUMN "baseScore" SET NOT NULL,
    ALTER COLUMN "deleted" SET NOT NULL,
    ALTER COLUMN "score" SET NOT NULL,
    ALTER COLUMN "voteCount" SET NOT NULL,
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "tagId" SET NOT NULL,
    ALTER COLUMN "postId" SET NOT NULL,
    ALTER COLUMN "inactive" SET NOT NULL;


  ALTER TABLE "Tags"
    ALTER COLUMN "adminOnly" SET NOT NULL,
    ALTER COLUMN "core" SET NOT NULL,
    ALTER COLUMN "defaultOrder" SET NOT NULL,
    ALTER COLUMN "deleted" SET NOT NULL,
    ALTER COLUMN "isPostType" SET NOT NULL,
    ALTER COLUMN "isSubforum" SET NOT NULL,
    ALTER COLUMN "noindex" SET NOT NULL,
    ALTER COLUMN "postCount" SET NOT NULL,
    ALTER COLUMN "subTagIds" SET NOT NULL,
    ALTER COLUMN "subforumModeratorIds" SET NOT NULL,
    ALTER COLUMN "suggestedAsFilter" SET NOT NULL,
    ALTER COLUMN "tagFlagsIds" SET NOT NULL,
    ALTER COLUMN "wikiGrade" SET NOT NULL,
    ALTER COLUMN "wikiOnly" SET NOT NULL,
    ALTER COLUMN "slug" SET NOT NULL,
    ALTER COLUMN "name" SET NOT NULL;


  ALTER TABLE "UserMostValuablePosts"
    ALTER COLUMN "deleted" SET NOT NULL,
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "postId" SET NOT NULL;


  ALTER TABLE "UserTagRels"
    ALTER COLUMN "subforumHideIntroPost" SET NOT NULL,
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "tagId" SET NOT NULL,
    ALTER COLUMN "subforumLastVisitedAt" SET NOT NULL;


  ALTER TABLE "Users"
    ALTER COLUMN "acceptedTos" SET NOT NULL,
    ALTER COLUMN "afCommentCount" SET NOT NULL,
    ALTER COLUMN "afKarma" SET NOT NULL,
    ALTER COLUMN "afPostCount" SET NOT NULL,
    ALTER COLUMN "afSequenceCount" SET NOT NULL,
    ALTER COLUMN "afSequenceDraftCount" SET NOT NULL,
    ALTER COLUMN "allowDatadogSessionReplay" SET NOT NULL,
    ALTER COLUMN "autoSubscribeAsOrganizer" SET NOT NULL,
    ALTER COLUMN "auto_subscribe_to_my_comments" SET NOT NULL,
    ALTER COLUMN "auto_subscribe_to_my_posts" SET NOT NULL,
    ALTER COLUMN "bookmarkedPostsMetadata" SET NOT NULL,
    ALTER COLUMN "commentCount" SET NOT NULL,
    ALTER COLUMN "deleted" SET NOT NULL,
    ALTER COLUMN "frontpagePostCount" SET NOT NULL,
    ALTER COLUMN "hiddenPostsMetadata" SET NOT NULL,
    ALTER COLUMN "hideAFNonMemberInitialWarning" SET NOT NULL,
    ALTER COLUMN "hideCommunitySection" SET NOT NULL,
    ALTER COLUMN "hideElicitPredictions" SET NOT NULL,
    ALTER COLUMN "hideHomeRHS" SET NOT NULL,
    ALTER COLUMN "hideIntercom" SET NOT NULL,
    ALTER COLUMN "hideMeetupsPoke" SET NOT NULL,
    ALTER COLUMN "hidePostsRecommendations" SET NOT NULL,
    ALTER COLUMN "hideSubscribePoke" SET NOT NULL,
    ALTER COLUMN "karmaChangeNotifierSettings" SET NOT NULL,
    ALTER COLUMN "legacy" SET NOT NULL,
    ALTER COLUMN "markDownPostEditor" SET NOT NULL,
    ALTER COLUMN "maxCommentCount" SET NOT NULL,
    ALTER COLUMN "maxPostCount" SET NOT NULL,
    ALTER COLUMN "nearbyEventsNotifications" SET NOT NULL,
    ALTER COLUMN "needsReview" SET NOT NULL,
    ALTER COLUMN "noCollapseCommentsFrontpage" SET NOT NULL,
    ALTER COLUMN "noCollapseCommentsPosts" SET NOT NULL,
    ALTER COLUMN "noExpandUnreadCommentsReview" SET NOT NULL,
    ALTER COLUMN "noSingleLineComments" SET NOT NULL,
    ALTER COLUMN "noindex" SET NOT NULL,
    ALTER COLUMN "notificationAlignmentSubmissionApproved" SET NOT NULL,
    ALTER COLUMN "notificationCommentsOnDraft" SET NOT NULL,
    ALTER COLUMN "notificationCommentsOnSubscribedPost" SET NOT NULL,
    ALTER COLUMN "notificationDebateCommentsOnSubscribedPost" SET NOT NULL,
    ALTER COLUMN "notificationDebateReplies" SET NOT NULL,
    ALTER COLUMN "notificationDialogueMessages" SET NOT NULL,
    ALTER COLUMN "notificationEventInRadius" SET NOT NULL,
    ALTER COLUMN "notificationGroupAdministration" SET NOT NULL,
    ALTER COLUMN "notificationNewMention" SET NOT NULL,
    ALTER COLUMN "notificationPostsInGroups" SET NOT NULL,
    ALTER COLUMN "notificationPostsNominatedReview" SET NOT NULL,
    ALTER COLUMN "notificationPrivateMessage" SET NOT NULL,
    ALTER COLUMN "notificationPublishedDialogueMessages" SET NOT NULL,
    ALTER COLUMN "notificationRSVPs" SET NOT NULL,
    ALTER COLUMN "notificationRepliesToMyComments" SET NOT NULL,
    ALTER COLUMN "notificationRepliesToSubscribedComments" SET NOT NULL,
    ALTER COLUMN "notificationSharedWithMe" SET NOT NULL,
    ALTER COLUMN "notificationShortformContent" SET NOT NULL,
    ALTER COLUMN "notificationSubforumUnread" SET NOT NULL,
    ALTER COLUMN "notificationSubscribedTagPost" SET NOT NULL,
    ALTER COLUMN "notificationSubscribedUserPost" SET NOT NULL,
    ALTER COLUMN "organizerOfGroupIds" SET NOT NULL,
    ALTER COLUMN "petrovOptOut" SET NOT NULL,
    ALTER COLUMN "postCount" SET NOT NULL,
    ALTER COLUMN "profileTagIds" SET NOT NULL,
    ALTER COLUMN "reactPaletteStyle" SET NOT NULL,
    ALTER COLUMN "sequenceCount" SET NOT NULL,
    ALTER COLUMN "sequenceDraftCount" SET NOT NULL,
    ALTER COLUMN "showCommunityInRecentDiscussion" SET NOT NULL,
    ALTER COLUMN "subscribedToDigest" SET NOT NULL,
    ALTER COLUMN "sunshineFlagged" SET NOT NULL,
    ALTER COLUMN "sunshineNotes" SET NOT NULL,
    ALTER COLUMN "sunshineSnoozed" SET NOT NULL,
    ALTER COLUMN "tagRevisionCount" SET NOT NULL,
    ALTER COLUMN "theme" SET NOT NULL,
    ALTER COLUMN "usernameUnset" SET NOT NULL,
    ALTER COLUMN "isAdmin" SET NOT NULL;


  ALTER TABLE "Votes"
    ALTER COLUMN "cancelled" SET NOT NULL,
    ALTER COLUMN "documentIsAf" SET NOT NULL,
    ALTER COLUMN "isUnvote" SET NOT NULL,
    ALTER COLUMN "voteType" SET NOT NULL,
    ALTER COLUMN "votedAt" SET NOT NULL,
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "power" SET NOT NULL,
    ALTER COLUMN "documentId" SET NOT NULL,
    ALTER COLUMN "collectionName" SET NOT NULL;


  ALTER TABLE "Bans"
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "expirationDate" SET NOT NULL,
    ALTER COLUMN "comment" SET NOT NULL;


  ALTER TABLE "CommentModeratorActions"
    ALTER COLUMN "type" SET NOT NULL,
    ALTER COLUMN "commentId" SET NOT NULL;


  ALTER TABLE "DatabaseMetadata"
    ALTER COLUMN "value" SET NOT NULL,
    ALTER COLUMN "name" SET NOT NULL;


  ALTER TABLE "DebouncerEvents"
    ALTER COLUMN "upperBoundTime" SET NOT NULL,
    ALTER COLUMN "name" SET NOT NULL,
    ALTER COLUMN "key" SET NOT NULL,
    ALTER COLUMN "dispatched" SET NOT NULL,
    ALTER COLUMN "delayTime" SET NOT NULL;


  ALTER TABLE "DigestPosts"
    ALTER COLUMN "postId" SET NOT NULL,
    ALTER COLUMN "onsiteDigestStatus" SET NOT NULL,
    ALTER COLUMN "emailDigestStatus" SET NOT NULL,
    ALTER COLUMN "digestId" SET NOT NULL;


  ALTER TABLE "EmailTokens"
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "tokenType" SET NOT NULL,
    ALTER COLUMN "token" SET NOT NULL;


  ALTER TABLE "FeaturedResources"
    ALTER COLUMN "title" SET NOT NULL,
    ALTER COLUMN "expiresAt" SET NOT NULL,
    ALTER COLUMN "ctaUrl" SET NOT NULL,
    ALTER COLUMN "ctaText" SET NOT NULL,
    ALTER COLUMN "body" SET NOT NULL;


  ALTER TABLE "Images"
    ALTER COLUMN "originalUrl" SET NOT NULL,
    ALTER COLUMN "cdnHostedUrl" SET NOT NULL;


  ALTER TABLE "LegacyData"
    ALTER COLUMN "objectId" SET NOT NULL,
    ALTER COLUMN "collectionName" SET NOT NULL;


  ALTER TABLE "ModeratorActions"
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "type" SET NOT NULL;


  ALTER TABLE "PageCache"
    ALTER COLUMN "ttlMs" SET NOT NULL,
    ALTER COLUMN "renderResult" SET NOT NULL,
    ALTER COLUMN "renderedAt" SET NOT NULL,
    ALTER COLUMN "path" SET NOT NULL,
    ALTER COLUMN "expiresAt" SET NOT NULL,
    ALTER COLUMN "bundleHash" SET NOT NULL,
    ALTER COLUMN "abTestGroups" SET NOT NULL;


  ALTER TABLE "PetrovDayLaunchs"
    ALTER COLUMN "launchCode" SET NOT NULL;


  ALTER TABLE "PodcastEpisodes"
    ALTER COLUMN "podcastId" SET NOT NULL;


  ALTER TABLE "PostRecommendations"
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "strategySettings" SET NOT NULL,
    ALTER COLUMN "clientId" SET NOT NULL,
    ALTER COLUMN "clickedAt" SET NOT NULL;


  ALTER TABLE "PostRelations"
    ALTER COLUMN "type" SET NOT NULL,
    ALTER COLUMN "targetPostId" SET NOT NULL,
    ALTER COLUMN "sourcePostId" SET NOT NULL;


  ALTER TABLE "ReadStatuses"
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "lastUpdated" SET NOT NULL,
    ALTER COLUMN "isRead" SET NOT NULL;


  ALTER TABLE "Reports"
    ALTER COLUMN "userId" SET NOT NULL,
    ALTER COLUMN "closedAt" SET NOT NULL;


  ALTER TABLE "Sessions"
    ALTER COLUMN "session" SET NOT NULL,
    ALTER COLUMN "expires" SET NOT NULL;


  ALTER TABLE "UserActivities"
    ALTER COLUMN "visitorId" SET NOT NULL,
    ALTER COLUMN "type" SET NOT NULL,
    ALTER COLUMN "startDate" SET NOT NULL,
    ALTER COLUMN "endDate" SET NOT NULL,
    ALTER COLUMN "activityArray" SET NOT NULL;


  ALTER TABLE "UserRateLimits"
    ALTER COLUMN "endedAt" SET NOT NULL;
`

export const up = async ({db}: MigrationContext) => {
  await db.none(fillInNullWithDefaultCommands);
  await db.none(setNotnullCommands);
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
