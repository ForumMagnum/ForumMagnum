// Alignment Forum imports
import * as alignmentCommentsFragments from '../alignment-forum/comments/fragments';
import * as alignmentPostsFragments from '../alignment-forum/posts/fragments';
import * as alignmentUsersFragments from '../alignment-forum/users/fragments';

// Collection imports
import * as advisorRequestsFragments from '../collections/advisorRequests/fragments';
import * as bansFragments from '../collections/bans/fragments';
import * as booksFragments from '../collections/books/fragments';
import * as chaptersFragments from '../collections/chapters/fragments';
import * as ckEditorUserSessionsFragments from '../collections/ckEditorUserSessions/fragments';
import * as clientIdsFragments from '../collections/clientIds/fragments';
import * as collectionsFragments from '../collections/collections/fragments';
import * as commentModeratorActionsFragments from '../collections/commentModeratorActions/fragments';
import * as commentsFragments from '../collections/comments/fragments';
import * as conversationsFragments from '../collections/conversations/fragments';
import * as curationNoticesFragments from '../collections/curationNotices/fragments';
import * as dialogueChecksFragments from '../collections/dialogueChecks/fragments';
import * as dialogueMatchPreferencesFragments from '../collections/dialogueMatchPreferences/fragments';
import * as digestPostsFragments from '../collections/digestPosts/fragments';
import * as digestsFragments from '../collections/digests/fragments';
import * as electionCandidatesFragments from '../collections/electionCandidates/fragments';
import * as electionVotesFragments from '../collections/electionVotes/fragments';
import * as elicitQuestionsFragments from '../collections/elicitQuestions/fragments';
import * as featuredResourcesFragments from '../collections/featuredResources/fragments';
import * as forumEventsFragments from '../collections/forumEvents/fragments';
import * as gardencodesFragments from '../collections/gardencodes/fragments';
import * as googleServiceAccountSessionsFragments from '../collections/googleServiceAccountSessions/fragments';
import * as jargonTermsFragments from '../collections/jargonTerms/fragments';
import * as llmConversationsFragments from '../collections/llmConversations/fragments';
import * as llmMessagesFragments from '../collections/llmMessages/fragments';
import * as localgroupsFragments from '../collections/localgroups/fragments';
import * as lweventsFragments from '../collections/lwevents/fragments';
import * as messagesFragments from '../collections/messages/fragments';
import * as moderationTemplatesFragments from '../collections/moderationTemplates/fragments';
import * as moderatorActionsFragments from '../collections/moderatorActions/fragments';
import * as multiDocumentsFragments from '../collections/multiDocuments/fragments';
import * as notificationsFragments from '../collections/notifications/fragments';
import * as petrovDayActionsFragments from '../collections/petrovDayActions/fragments';
import * as petrovDayLaunchsFragments from '../collections/petrovDayLaunchs/fragments';
import * as podcastEpisodesFragments from '../collections/podcastEpisodes/fragments';
import * as podcastsFragments from '../collections/podcasts/fragments';
import * as postsFragments from '../collections/posts/fragments';
import * as reportsFragments from '../collections/reports/fragments';
import * as reviewVotesFragments from '../collections/reviewVotes/fragments';
import * as reviewWinnerArtsFragments from '../collections/reviewWinnerArts/fragments';
import * as reviewWinnersFragments from '../collections/reviewWinners/fragments';
import * as revisionsFragments from '../collections/revisions/fragments';
import * as rssfeedsFragments from '../collections/rssfeeds/fragments';
import * as sequencesFragments from '../collections/sequences/fragments';
import * as sideCommentCachesFragments from '../collections/sideCommentCaches/fragments';
import * as splashArtCoordinatesFragments from '../collections/splashArtCoordinates/fragments';
import * as spotlightsFragments from '../collections/spotlights/fragments';
import * as subscriptionsFragments from '../collections/subscriptions/fragments';
import * as surveyQuestionsFragments from '../collections/surveyQuestions/fragments';
import * as surveyResponsesFragments from '../collections/surveyResponses/fragments';
import * as surveySchedulesFragments from '../collections/surveySchedules/fragments';
import * as surveysFragments from '../collections/surveys/fragments';
import * as tagFlagsFragments from '../collections/tagFlags/fragments';
import * as tagRelsFragments from '../collections/tagRels/fragments';
import * as tagsFragments from '../collections/tags/fragments';
import * as typingIndicatorsFragments from '../collections/typingIndicators/fragments';
import * as userEAGDetailsFragments from '../collections/userEAGDetails/fragments';
import * as userJobAdsFragments from '../collections/userJobAds/fragments';
import * as userMostValuablePostsFragments from '../collections/userMostValuablePosts/fragments';
import * as userRateLimitsFragments from '../collections/userRateLimits/fragments';
import * as userTagRelsFragments from '../collections/userTagRels/fragments';
import * as usersFragments from '../collections/users/fragments';
import * as votesFragments from '../collections/votes/fragments';
import * as subscribedUserFeedFragments from '../subscribedUsersFeed';
import { getAllCollections } from '../vulcan-lib/getCollection';

// Create default "dumb" gql fragment object for a given collection
function getDefaultFragmentText<N extends CollectionNameString>(
  collection: CollectionBase<N>,
  schema: SchemaType<N>,
  options = { onlyViewable: true },
): string|null {
  const fieldNames = Object.keys(schema).filter((fieldName: string) => {
    /*

    Exclude a field from the default fragment if
    1. it has a resolver and addOriginalField is false
    2. it has $ in its name
    3. it's not viewable (if onlyViewable option is true)

    */
    const field: CollectionFieldSpecification<N> = schema[fieldName];
    // OpenCRUD backwards compatibility

    const isResolverField = field.resolveAs && !field.resolveAs.addOriginalField && field.resolveAs.type !== "ContentType";
    return !(isResolverField || fieldName.includes('$') || fieldName.includes('.') || (options.onlyViewable && !field.canRead));
  });

  if (fieldNames.length) {
    const fragmentText = `
      fragment ${collection.collectionName}DefaultFragment on ${collection.typeName} {
        ${fieldNames.map(fieldName => {
          return fieldName+'\n';
        }).join('')}
      }
    `;

    return fragmentText;
  } else {
    return null;
  }
};

const defaultFragments = Object.fromEntries(
  getAllCollections()
    .map(collection => [`${collection.collectionName}DefaultFragment`, getDefaultFragmentText(collection, collection._schemaFields)])
    .filter(([_, fragment]) => fragment !== null)
) as Record<Extract<keyof FragmentTypes, `${CollectionNameString}DefaultFragment`>, string>;

export const allFragments = {
  ...alignmentCommentsFragments,
  ...alignmentPostsFragments,
  ...alignmentUsersFragments,
  
  ...advisorRequestsFragments,
  ...bansFragments,
  ...booksFragments,
  ...chaptersFragments,
  ...ckEditorUserSessionsFragments,
  ...clientIdsFragments,
  ...collectionsFragments,
  ...commentModeratorActionsFragments,
  ...commentsFragments,
  ...conversationsFragments,
  ...curationNoticesFragments,
  ...dialogueChecksFragments,
  ...dialogueMatchPreferencesFragments,
  ...digestPostsFragments,
  ...digestsFragments,
  ...electionCandidatesFragments,
  ...electionVotesFragments,
  ...elicitQuestionsFragments,
  ...featuredResourcesFragments,
  ...forumEventsFragments,
  ...gardencodesFragments,
  ...googleServiceAccountSessionsFragments,
  ...jargonTermsFragments,
  ...llmConversationsFragments,
  ...llmMessagesFragments,
  ...localgroupsFragments,
  ...lweventsFragments,
  ...messagesFragments,
  ...moderationTemplatesFragments,
  ...moderatorActionsFragments,
  ...multiDocumentsFragments,
  ...notificationsFragments,
  ...petrovDayActionsFragments,
  ...petrovDayLaunchsFragments,
  ...podcastEpisodesFragments,
  ...podcastsFragments,
  ...postsFragments,
  ...reportsFragments,
  ...reviewVotesFragments,
  ...reviewWinnerArtsFragments,
  ...reviewWinnersFragments,
  ...revisionsFragments,
  ...rssfeedsFragments,
  ...sequencesFragments,
  ...sideCommentCachesFragments,
  ...splashArtCoordinatesFragments,
  ...spotlightsFragments,
  ...subscriptionsFragments,
  ...surveyQuestionsFragments,
  ...surveyResponsesFragments,
  ...surveySchedulesFragments,
  ...surveysFragments,
  ...tagFlagsFragments,
  ...tagRelsFragments,
  ...tagsFragments,
  ...typingIndicatorsFragments,
  ...userEAGDetailsFragments,
  ...userJobAdsFragments,
  ...userMostValuablePostsFragments,
  ...userRateLimitsFragments,
  ...userTagRelsFragments,
  ...usersFragments,
  ...votesFragments,
  ...subscribedUserFeedFragments,
  ...defaultFragments,
};
