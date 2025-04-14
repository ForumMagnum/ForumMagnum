// Centralized control of beta-gated features. If a feature is restricted to
// admins or to users with the opt-in flag, implement that by defining a
// function here which returns whether a given user has access to that feature.
// That way, we can look here to see what features are currently beta-gated,
// and have an easy way to un-gate in all the relevant places at once.
//
// Beta-feature test functions must handle the case where user is null.

import {
  testServerSetting,
  isEAForum,
  isLWorAF,
  hasCommentsTableOfContentSetting,
  hasSideCommentsSetting, 
  hasDialoguesSetting, 
  hasPostInlineReactionsSetting,
  isBotSiteSetting,
  isLW,
} from './instanceSettings'
import { isAdmin, userOverNKarmaOrApproved } from "./vulcan-users/permissions";
import {isFriendlyUI} from '../themes/forumTheme'
import { recombeeEnabledSetting, userIdsWithAccessToLlmChat } from './publicSettings';
import { useLocation } from './routeUtil';
import { isAnyTest } from './executionEnvironment';

// States for in-progress features
const adminOnly = (user: UsersCurrent|DbUser|null): boolean => !!user?.isAdmin; // eslint-disable-line no-unused-vars
const moderatorOnly = (user: UsersCurrent|DbUser|null): boolean => !!(user?.isAdmin || user?.groups?.includes('sunshineRegiment'))
const optInOnly = (user: UsersCurrent|DbUser|null): boolean => !!user?.beta; // eslint-disable-line no-unused-vars
const shippedFeature = (user: UsersCurrent|DbUser|null): boolean => true; // eslint-disable-line no-unused-vars
const disabled = (user: UsersCurrent|DbUser|null): boolean => false; // eslint-disable-line no-unused-vars
const testServerOnly = (_: UsersCurrent|DbUser|null): boolean => testServerSetting.get();
const adminOrBeta = (user: UsersCurrent|DbUser|null): boolean => adminOnly(user) || optInOnly(user);

//////////////////////////////////////////////////////////////////////////////
// Features in progress                                                     //
//////////////////////////////////////////////////////////////////////////////

export const userCanEditTagPortal = isEAForum ? moderatorOnly : adminOnly;
export const userHasBoldPostItems = disabled
export const userHasEAHomeHandbook = adminOnly
export const userCanCreateCommitMessages = moderatorOnly;
export const userHasRedesignedSettingsPage = disabled;
export const userCanUseSharing = (user: UsersCurrent|DbUser|null): boolean => moderatorOnly(user) || userOverNKarmaOrApproved(1)(user);
export const userHasNewTagSubscriptions =  isEAForum ? shippedFeature : disabled
export const userHasDefaultProfilePhotos = disabled

export const userHasAutosummarize = adminOnly

export const userHasThemePicker = isFriendlyUI ? adminOnly : shippedFeature;

export const userHasCommentProfileImages = disabled;

export const userHasEagProfileImport = disabled;

export const userHasEAHomeRHS = isEAForum ? shippedFeature : disabled;

export const visitorGetsDynamicFrontpage = isLW ? shippedFeature : disabled;

export const userHasPeopleDirectory = (user: UsersCurrent|DbUser|null) =>
  isEAForum;

export const userHasSubscribeTabFeed = isLW ? shippedFeature : disabled;

export const userHasUltraFeed = isLW ? isAdmin : disabled;

//defining as Hook so as to combine with ABTest
export const useRecombeeFrontpage = (currentUser: UsersCurrent|DbUser|null) => {
  // TODO: figure out what went wrong with the AB tests causing caching issues, beyond `affectsLoggedOut` being set to false
  // const recombeeOptInABTest = useABTest(newFrontpagePostFeedsWithRecommendationsOptIn)
  // const optedIntoRecombee = (recombeeOptInABTest === "frontpageWithTabs")
  const { query } = useLocation();
  
  const manualOptIn = currentUser && query.recExperiment === 'true';

  return isLW && (isAdmin(currentUser) || manualOptIn) && recombeeEnabledSetting.get()
}

export const userHasLlmChat = (currentUser: UsersCurrent|DbUser|null): currentUser is UsersCurrent|DbUser => {
  if (!currentUser) {
    return false
  }
  const userIdsWithAccess = userIdsWithAccessToLlmChat.get();
  
  return isLW && (isAdmin(currentUser) || userIdsWithAccess.includes(currentUser._id));
}

export const userHasDarkModeHotkey = isEAForum ? adminOnly : shippedFeature;

export const userHasPostAutosave = isLWorAF ? adminOnly : disabled;

// Non-user-specific features
export const dialoguesEnabled = hasDialoguesSetting.get();
export const ckEditorUserSessionsEnabled = isLWorAF;
export const inlineReactsHoverEnabled = hasPostInlineReactionsSetting.get();
export const allowSubscribeToUserComments = true;
export const allowSubscribeToSequencePosts = isFriendlyUI;
/** On the post page, do we show users other content they might want to read */
export const hasPostRecommendations = isEAForum;
/** Some Forums, notably the EA Forum, have a mailchimp email lists */
export const hasDigests = isEAForum;
export const hasNewsletter = isEAForum;

/**
 * Whether the instance should have any features for integrating with twitter.
 * This is different to `twitterBot.enabled`, as there are features to help
 * with manual posting too.
 */
export const hasTwitterFeatures = isEAForum;
export const hasAccountDeletionFlow = isEAForum;
export const hasSideComments = hasSideCommentsSetting.get();
export const useElicitApi = false;
export const commentsTableOfContentsEnabled = hasCommentsTableOfContentSetting.get();
export const fullHeightToCEnabled = isLWorAF;
export const hasForumEvents = isEAForum;
export const hasSurveys = isFriendlyUI && !isBotSiteSetting.get();
export const hasCollapsedFootnotes = !isLWorAF;
export const useCurationEmailsCron = isLW;
export const hasSidenotes = isLWorAF;
export const visitedLinksHaveFilledInCircle = isLWorAF;
export const hasWikiLenses = isLWorAF;
export const hasSubforums = isEAForum;

// EA Forum disabled the author's ability to moderate posts. We disregard this
// check in tests as the tests run in EA Forum mode, but we want to be able to
// test the moderation features.
export const hasAuthorModeration = !isEAForum || isAnyTest;

export const userCanCreateAndEditJargonTerms = (user: UsersCurrent|DbUser|null) => isLW && !!user && user.karma >= 100;
export const userCanViewJargonTerms = (user: UsersCurrent|DbUser|null) => isLW;
export const userCanViewUnapprovedJargonTerms = (user: UsersCurrent|DbUser|null) => isLW
/* if this is reduced to 0, we need to make sure to handle spam somehow */
export const userCanPassivelyGenerateJargonTerms = (user: UsersCurrent|DbUser|null) => isLW && !!user && user.karma >= 100

// Shipped Features
export const userCanManageTags = shippedFeature;
export const userCanCreateTags = shippedFeature;
export const userCanUseTags = shippedFeature;
export const userCanViewRevisionHistory = shippedFeature;
export const userHasPingbacks = shippedFeature;
export const userHasElasticsearch = shippedFeature;
