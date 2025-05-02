// vulcan:users
import './vulcan-users/index';

// schema utils
import './utils/schemaUtils'

// Permissions
import './permissions';

// ## Voting
import './voting/voteTypes';
import './voting/votingSystems';
import './voting/reactionsAndLikes';
import './voting/namesAttachedReactions';

//MomentJS configuration
import '../components/momentjs';

import './collections/posts/fragments';
import './collections/comments/fragments';
import './collections/revisions/fragments';

// ClientIds
// import './collections/clientIds/collection';

// Notifications
// import './collections/notifications/collection';
import './collections/notifications/views';
import './collections/notifications/fragments';

// Images
// import './collections/images/collection';

// Inbox
// import './collections/messages/collection'
import './collections/messages/views';
import './collections/messages/helpers';
import './collections/messages/fragments';

// import './collections/conversations/collection'
import './collections/conversations/views';
import './collections/conversations/helpers';
import './collections/conversations/fragments';

// RSSFeeds
// import './collections/rssfeeds/collection'
import './collections/rssfeeds/views'
import './collections/rssfeeds/fragments'

// Reports
// import './collections/reports/collection'
import './collections/reports/views'
import './collections/reports/fragments'

// LWEvents
// import './collections/lwevents/collection';
import './collections/lwevents/fragments';
import './collections/lwevents/views';

// TagFlags
// import './collections/tagFlags/collection';
import './collections/tagFlags/views';

// FieldChanges
import './collections/fieldChanges/fragments';
import './collections/fieldChanges/views';

// GardenCodes
// import "./collections/gardencodes/collection";
import './collections/gardencodes/views'

// DatabaseMetadata
// import './collections/databaseMetadata/collection';

// Migrations
// import './collections/migrations/collection';

// DebouncerEvents
// import './collections/debouncerEvents/collection';


// ReadStatuses
// import './collections/readStatus/collection';
// Bans
// import './collections/bans/collection';
import './collections/bans/fragments';

// Chapters
// import './collections/sequences/collection';
import './collections/sequences/views';
import './collections/sequences/helpers';

// import './collections/chapters/collection';

// import './collections/books/collection';
// import './collections/collections/collection';

// ReviewVotes
// import './collections/reviewVotes/collection'
import './collections/reviewVotes/views'
import './collections/reviewVotes/fragments'

// import './collections/manifoldProbabilitiesCaches/collection';
import './collections/manifoldProbabilitiesCaches/newSchema';

// import './collections/localgroups/collection'
import './collections/localgroups/views';
import './collections/localgroups/fragments';

import './collections/chapters/fragments';
import './collections/sequences/fragments';
import './collections/books/fragments';
import './collections/collections/fragments';
import './collections/collections/views';
import './collections/collections/helpers';

// import './collections/tagRels/collection';
import './collections/tagRels/views';
import './collections/tagRels/fragments';

// import './collections/userTagRels/collection';
import './collections/userTagRels/views';
import './collections/userTagRels/fragments';

// import './collections/tags/collection';
import './collections/tags/views';
import './collections/tags/fragments';
import './collections/tags/helpers';
import './collections/tags/newSchema';
import './collections/tags/permissions';

// import './collections/tweets/collection'

import './collections/chapters/views';

// import './collections/advisorRequests/collection';
import './collections/advisorRequests/fragments';
import './collections/advisorRequests/views';

// import './collections/userJobAds/collection';
import './collections/userJobAds/fragments';
import './collections/userJobAds/views';

// import './collections/userEAGDetails/collection';
import './collections/userEAGDetails/fragments';
import './collections/userEAGDetails/views';

// import './collections/userMostValuablePosts/collection';
import './collections/userMostValuablePosts/fragments';
import './collections/userMostValuablePosts/views';

// import './collections/useractivities/collection';
import './collections/useractivities/newSchema';

// import './collections/pagecache/collection';
import './collections/pagecache/newSchema';

// import './collections/digestPosts/collection';
import './collections/digestPosts/fragments';
import './collections/digestPosts/newSchema';

// import './collections/digests/collection';
import './collections/digests/fragments';
import './collections/digests/newSchema';
import './collections/digests/views';

// Forum events
// import './collections/forumEvents/collection';
import './collections/forumEvents/fragments';
import './collections/forumEvents/views';

// Subscriptions
// import './collections/subscriptions/collection';
import './collections/subscriptions/fragments';
import './collections/subscriptions/views';

// Podcasts
// import './collections/podcasts/collection';
import './collections/podcasts/fragments';
// Podcast episodes
// import './collections/podcastEpisodes/collection';
import './collections/podcastEpisodes/fragments';
import './collections/podcastEpisodes/views';

// Posts
import './collections/posts/newSchema';
import './collections/posts/views';
import './collections/posts/helpers';

// PostViews
// import './collections/postViews/collection';

// PostViewTimes
// import './collections/postViewTimes/collection';

// Revisions
// import './collections/revisions/collection'
import './collections/revisions/views'
//
// Users
import './collections/users/helpers';
import './collections/users/newSchema';
import './collections/users/recommendationSettings';
import './collections/users/views';
import './collections/users/fragments';

// Comments
// import './collections/comments/collection';
import './collections/comments/views';
import './collections/comments/voting';

// import './collections/petrovDayLaunchs/collection';
import './collections/petrovDayLaunchs/fragments';

// import './collections/petrovDayActions/collection'
import './collections/petrovDayActions/fragments'
import './collections/petrovDayActions/views'

// import './collections/featuredResources/collection'
import './collections/featuredResources/views'
import './collections/featuredResources/fragments'

// Votes
// import './collections/votes/collection';
import './collections/votes/fragments';
import './collections/votes/views';

// Spotlights
// import './collections/spotlights/collection';
import './collections/spotlights/fragments';
import './collections/spotlights/views';

// Moderator actions
// import './collections/moderatorActions/collection';
import './collections/moderatorActions/fragments';
import './collections/moderatorActions/views';

// Comment moderator actions
// import './collections/commentModeratorActions/collection';
import './collections/commentModeratorActions/fragments';
import './collections/commentModeratorActions/views';

// ModerationTemplates
// import './collections/moderationTemplates/collection';
import './collections/moderationTemplates/fragments';
import './collections/moderationTemplates/views';

// CurationNotices
// import './collections/curationNotices/collection';
import './collections/curationNotices/fragments';
import './collections/curationNotices/views';

// UserRateLimits
// import './collections/userRateLimits/collection';
import './collections/userRateLimits/fragments';
import './collections/userRateLimits/views';

// PostEmbeddings
// import './collections/postEmbeddings/collection';

// SideCommentCaches
// import './collections/sideCommentCaches/collection';
import './collections/sideCommentCaches/fragments';

// MultiDocuments
// import "./collections/multiDocuments/collection";
import "./collections/multiDocuments/fragments";
import "./collections/multiDocuments/views";

// Misc.
import './helpers'
import './routes';

import '@/allComponents';

// PostRelation
// import './collections/postRelations/collection';
import './collections/postRelations/fragments';
import './collections/postRelations/views';;

// PostRecommendations
// import './collections/postRecommendations/collection';

// ElectionCandidates
// import './collections/electionCandidates/collection';
import './collections/electionCandidates/fragments';
import './collections/electionCandidates/views';

// ElectionVotes
// import './collections/electionVotes/collection';
import './collections/electionVotes/fragments';
import './collections/electionVotes/views';

// GoogleServiceAccountSessions
// import './collections/googleServiceAccountSessions/collection';
import './collections/googleServiceAccountSessions/fragments';
import './collections/googleServiceAccountSessions/views';

// Collections supporting vendored libraries
// import './collections/cronHistories/collection';
// import './collections/sessions/collection';

// dialogue typing indicators
// import './collections/typingIndicators/collection';
import './collections/typingIndicators/fragments';

// elicit questions
// import './collections/elicitQuestions/collection';

// elicit predictions
// import './collections/elicitQuestionPredictions/collection';

// dialogue checks
// import './collections/dialogueChecks/collection';
import './collections/dialogueChecks/fragments';
import './collections/dialogueChecks/views';

// dialogue match preferences
// import './collections/dialogueMatchPreferences/collection';
import './collections/dialogueMatchPreferences/fragments';
import './collections/dialogueMatchPreferences/views';

// dialogue match preferences
// import './collections/ckEditorUserSessions/collection';
import './collections/ckEditorUserSessions/fragments';

// Arbital
// import './collections/arbitalCache/collection';
// import './collections/arbitalTagContentRels/collection';

// Review winners
// import './collections/reviewWinners/collection';
import './collections/reviewWinners/fragments';
import './collections/reviewWinners/views';

// Review winners
// import './collections/reviewWinnerArts/collection';
import './collections/reviewWinnerArts/fragments';
import './collections/reviewWinnerArts/views';

// Splash art coordinates
// import './collections/splashArtCoordinates/collection';
import './collections/splashArtCoordinates/fragments';

// Curation emails
// import './collections/curationEmails/collection';

// Recommendations cache
// import './collections/recommendationsCaches/collection';

// Surveys
// import "./collections/surveys/collection";
import "./collections/surveys/fragments";
import "./collections/surveys/views";
// import "./collections/surveyQuestions/collection";
import "./collections/surveyQuestions/fragments";
// import "./collections/surveyResponses/collection";
import "./collections/surveyResponses/fragments";
// import "./collections/surveySchedules/collection";
import "./collections/surveySchedules/fragments";
import "./collections/surveySchedules/views";

// LLM Conversations
// import "./collections/llmConversations/collection";
import "./collections/llmConversations/fragments";
import "./collections/llmConversations/views";
// import "./collections/llmMessages/collection";
import "./collections/llmMessages/fragments";

// Alignment Forum
import './alignment-forum/posts/helpers';

import './alignment-forum/comments/helpers';

import './alignment-forum/users/helpers';

import './analyticsEvents';
import './abTests';
import './vulcan-i18n-en-us';

import '../components/spuriousChange';

import './rateLimits/constants';
import './rateLimits/types';

import './subscribedUsersFeed';
import './ultraFeed';

// import './collections/jargonTerms/collection';
import './collections/jargonTerms/views';
import './collections/jargonTerms/fragments';
import './collections/jargonTerms/newSchema';
