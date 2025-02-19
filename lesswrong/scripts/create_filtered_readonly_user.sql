-- This script creates a readonly user that is filtered to only access
-- public information.
-- The password is set using a psql variable:
-- psql --set=filtered_readonly_password="some_secret_password" <conn parameters> -f ./scripts/create_filtered_readonly_user.sql

DO
$$BEGIN
IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'filtered_readonly') THEN
	REVOKE ALL ON ALL TABLES IN SCHEMA public FROM filtered_readonly;
ELSE
	CREATE USER filtered_readonly WITH
		NOCREATEDB NOSUPERUSER NOCREATEROLE NOINHERIT
		PASSWORD :'filtered_readonly_password';
END IF;
END$$;

GRANT SELECT ON "Books" TO filtered_readonly;
GRANT SELECT ON "Chapters" TO filtered_readonly;
GRANT SELECT ON "Collections" TO filtered_readonly;
GRANT SELECT ON "Comments" TO filtered_readonly;
GRANT SELECT ON "FeaturedResources" TO filtered_readonly;
GRANT SELECT ON "Localgroups" TO filtered_readonly;
GRANT SELECT ON "PodcastEpisodes" TO filtered_readonly;
GRANT SELECT ON "Podcasts" TO filtered_readonly;
GRANT SELECT ON "PostRelations" TO filtered_readonly;
GRANT SELECT ON "Posts" TO filtered_readonly;
GRANT SELECT ON "Revisions" TO filtered_readonly;
GRANT SELECT ON "Sequences" TO filtered_readonly;
GRANT SELECT ON "Spotlights" TO filtered_readonly;
GRANT SELECT ON "TagFlags" TO filtered_readonly;
GRANT SELECT ON "TagRels" TO filtered_readonly;
GRANT SELECT ON "Tags" TO filtered_readonly;

CREATE OR REPLACE VIEW "filtered_readonly_LWEvents" AS
SELECT "_id", "userId", "name", "documentId", "important",
	"intercom", "schemaVersion", "createdAt", "legacyData"
FROM "LWEvents"
WHERE "name" IN ('login', 'post-view', 'tag-view');

GRANT SELECT ON "filtered_readonly_LWEvents" TO filtered_readonly;

CREATE OR REPLACE VIEW "filtered_readonly_Users" AS
SELECT 	"_id", "username", "emails", "email", "isAdmin", "displayName", "slug",
	"noindex", "groups", "lwWikiImport", "theme", "lastUsedTimezone",
	"legacy", "commentSorting", "sortDraftsBy", "noKibitz", "showHideKarmaOption",
	"showPostAuthorCard", "hideIntercom", "markDownPostEditor", "hideElicitPredictions",
	"hideAFNonMemberInitialWarning", "noSingleLineComments", "noCollapseCommentsPosts",
	"noCollapseCommentsFrontpage", "petrovOptOut", "acceptedTos", "hideNavigationSidebar",
	"currentFrontpageFilter", "frontpageFilterSettings", "allPostsTimeframe", "allPostsFilter",
	"allPostsSorting", "allPostsShowLowKarma", "allPostsIncludeEvents", "allPostsOpenSettings",
	"draftsListSorting", "draftsListShowArchived", "draftsListShowShared", "lastNotificationsCheck",
	"karma", "goodHeartTokens", "moderationStyle", "moderatorAssistance", "collapseModerationGuidelines",
	"bookmarkedPostsMetadata", "hiddenPostsMetadata", "legacyId", "deleted", "voteBanned", "nullifyVotes",
	"deleteContent", "banned", "auto_subscribe_to_my_posts", "auto_subscribe_to_my_comments",
	"autoSubscribeAsOrganizer", "notificationCommentsOnSubscribedPost", "notificationShortformContent",
	"notificationRepliesToMyComments", "notificationRepliesToSubscribedComments",
	"notificationSubscribedUserPost", "notificationPostsInGroups", "notificationSubscribedTagPost",
	"notificationPrivateMessage", "notificationSharedWithMe", "notificationAlignmentSubmissionApproved",
	"notificationEventInRadius", "notificationRSVPs", "notificationGroupAdministration",
	"notificationCommentsOnDraft", "notificationPostsNominatedReview", "notificationSubforumUnread",
	"notificationNewMention", "karmaChangeNotifierSettings", "karmaChangeLastOpened",
	"karmaChangeBatchStart", "emailSubscribedToCurated", "subscribedToDigest", "unsubscribeFromAll",
	"hideSubscribePoke", "hideMeetupsPoke", "frontpagePostCount", "sequenceCount", "sequenceDraftCount",
	"nearbyEventsNotifications", "nearbyEventsNotificationsRadius", "nearbyPeopleNotificationThreshold",
	"hideFrontpageMap", "hideTaggingProgressBar", "hideFrontpageBookAd", "hideFrontpageBook2019Ad",
	"reviewedAt", "afKarma", "voteCount", "smallUpvoteCount", "smallDownvoteCount", "bigUpvoteCount",
	"bigDownvoteCount", "fullName", "shortformFeedId", "viewUnreviewedComments", "partiallyReadSequences",
	"beta", "reviewVotesQuadratic", "reviewVotesQuadratic2019", "reviewVotesQuadratic2020",
	"petrovPressedButtonDate", "petrovLaunchCodeDate", "defaultToCKEditor", "signUpReCaptchaRating",
	"oldSlugs", "noExpandUnreadCommentsReview", "postCount", "maxPostCount", "commentCount",
	"maxCommentCount", "tagRevisionCount", "abTestKey", "abTestOverrides", "reenableDraftJs",
	"walledGardenInvite", "hideWalledGardenUI", "walledGardenPortalOnboarded",
	"taggingDashboardCollapsed", "usernameUnset", "jobTitle", "organization", "careerStage", "website",
	"fmCrosspostUserId", "linkedinProfileURL", "facebookProfileURL", "twitterProfileURL",
	"githubProfileURL", "profileTagIds", "organizerOfGroupIds", "programParticipation", "postingDisabled",
	"allCommentingDisabled", "commentingOnOtherUsersDisabled", "conversationsDisabled",
	"acknowledgedNewUserGuidelines", "subforumPreferredLayout", "experiencedIn", "interestedIn",
	"allowDatadogSessionReplay", "schemaVersion", "createdAt", "moderationGuidelines",
	"moderationGuidelines_latest", "howOthersCanHelpMe", "howOthersCanHelpMe_latest", "howICanHelpOthers",
	"howICanHelpOthers_latest", "biography", "biography_latest", "recommendationSettings",
	"hideFrontpageFilterSettingsDesktop", "usersContactedBeforeReview", "showCommunityInRecentDiscussion",
	"allPostsHideCommunity", "notificationDebateCommentsOnSubscribedPost",
	"notificationDebateReplies"
FROM "Users";

GRANT SELECT ON "filtered_readonly_Users" TO filtered_readonly;
