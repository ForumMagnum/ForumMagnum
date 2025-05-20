// Note: this file is modified by the `create-collection` codegen script.
// Keep that in mind if changing the structure.

// Helper imports
import { SqlFragment } from '@/server/sql/SqlFragment';
import type { DocumentNode, FragmentDefinitionNode } from 'graphql';
import uniq from 'lodash/uniq';
import { isAnyTest } from '../executionEnvironment';
import LRU from "lru-cache";
import { TypedDocumentNode } from '@apollo/client';
import { print } from 'graphql';
import { transformFragments } from './fragmentWrapper';

// Generated default fragments
import * as defaultFragments from '@/lib/generated/defaultFragments';

// Collection imports
import * as advisorRequestsFragments from '../collections/advisorRequests/fragments';
import * as bansFragments from '../collections/bans/fragments';
import * as bookmarksFragments from '../collections/bookmarks/fragments';
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
import * as fieldChangesFragments from '../collections/fieldChanges/fragments';
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
import * as ultraFeedEventsFragments from '../collections/ultraFeedEvents/fragments';
import * as userEAGDetailsFragments from '../collections/userEAGDetails/fragments';
import * as userJobAdsFragments from '../collections/userJobAds/fragments';
import * as userMostValuablePostsFragments from '../collections/userMostValuablePosts/fragments';
import * as userRateLimitsFragments from '../collections/userRateLimits/fragments';
import * as userTagRelsFragments from '../collections/userTagRels/fragments';
import * as usersFragments from '../collections/users/fragments';
import * as votesFragments from '../collections/votes/fragments';

// Non-collection fragments
import * as subscribedUserFeedFragments from '../subscribedUsersFeed';
import * as ultraFeedFragments from '../ultraFeed';

// Unfortunately the inversion with sql fragment compilation is a bit tricky to unroll, so for now we just dynamically load the test fragments if we're in a test environment.
// We type this as Record<never, never> because we want to avoid it clobbering the rest of the fragment types.
// TODO: does this need fixing to avoid esbuild headaches?  I think no, but could be risky in the future.
let testFragments: Record<never, never>;
if (isAnyTest) {
  testFragments = require('../../server/sql/tests/testFragments');
} else {
  testFragments = {};
}

const staticFragments = transformFragments({
  // Collection fragments
  ...advisorRequestsFragments,
  ...bansFragments,
  ...bookmarksFragments,
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
  ...fieldChangesFragments,
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
  ...surveysFragments,
  ...surveySchedulesFragments,
  ...tagFlagsFragments,
  ...tagRelsFragments,
  ...tagsFragments,
  ...typingIndicatorsFragments,
  // ...ultraFeedEventsFragments,
  ...userEAGDetailsFragments,
  ...userJobAdsFragments,
  ...userMostValuablePostsFragments,
  ...userRateLimitsFragments,
  ...usersFragments,
  ...userTagRelsFragments,
  ...votesFragments,

  // Non-collection fragments
  ...subscribedUserFeedFragments,
  ...ultraFeedFragments,

  // Test fragments
  ...testFragments,
});

// TODO: I originally implemented this with deferred execution because getDefaultFragments needed to be called after the collections were registered
// But now we're generating the default fragments in a separate step, so maybe we can just do this in one go?
export const getAllFragments = (() => {
  let allFragments: typeof staticFragments & Record<keyof typeof defaultFragments, string>;
  return () => {
    if (!allFragments) {
      allFragments = {
        ...staticFragments,
        ...transformFragments(defaultFragments),
      };
    }
    return allFragments;
  };
})();

interface FragmentDefinition {
  fragmentText: string
  subFragments?: Array<FragmentName>
  fragmentObject?: DocumentNode
}

const memoizedFragmentInfo: Partial<Record<FragmentName, FragmentDefinition>> = {};

const sqlFragmentCache = new LRU<string, SqlFragment>({
  max: 5_000_000,
  // Rough estimate that a SQL Fragment is 3x the size of the fragment text, plus the fragment text itself as the key
  // I'm not sure how the key might be missing, but empirically our queries end up measuring at about 10kb
  length: (_, key) => !key ? 10_000 : key.length * 4,
});


export function getSqlFragment(fragmentName: string, fragmentText: string): SqlFragment {
  // Remove comments from the fragment source text
  fragmentText = fragmentText.replace(/#.*\n/g, '\n');

  const cached = sqlFragmentCache.get(fragmentText);
  if (cached) {
    return cached;
  }
  const sqlFragment = new SqlFragment(fragmentName, fragmentText);
  sqlFragmentCache.set(fragmentText, sqlFragment);
  return sqlFragment;
}

// Register a fragment, including its text, the text of its subfragments, and the fragment object
function registerFragment(fragmentTextSource: string): FragmentDefinition {
  // remove comments
  const fragmentText = fragmentTextSource.replace(/#.*\n/g, '\n');

  // extract subFragments from text
  const matchedSubFragments = fragmentText.match(/\.{3}([_A-Za-z][_0-9A-Za-z]*)/g) || [];
  const subFragments = uniq(matchedSubFragments.map(f => f.replace('...', '')));

  const fragmentDefinition: FragmentDefinition = {
    fragmentText,
  };

  if (subFragments && subFragments.length) {
    fragmentDefinition.subFragments = subFragments as Array<FragmentName>;
  }

  return fragmentDefinition;
}

export function getMemoizedFragmentInfo(fragmentName: FragmentName): FragmentDefinition {
  let fragmentDefinition = memoizedFragmentInfo[fragmentName];
  if (!fragmentDefinition) {
    fragmentDefinition = registerFragment(getAllFragments()[fragmentName]);
    memoizedFragmentInfo[fragmentName] = fragmentDefinition;
  }

  return fragmentDefinition;
}
