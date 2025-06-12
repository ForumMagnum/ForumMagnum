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
import { userIdsWithAccessToLlmChat } from './publicSettings';
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

export const userCanEditTagPortal = moderatorOnly;
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

export const userHasLlmChat = (currentUser: UsersCurrent|DbUser|null): currentUser is UsersCurrent|DbUser => {
  if (!currentUser) {
    return false
  }
  const userIdsWithAccess = userIdsWithAccessToLlmChat.get();
  
  return isLW && (isAdmin(currentUser) || userIdsWithAccess.includes(currentUser._id));
}

export const userHasDarkModeHotkey = isEAForum ? adminOnly : shippedFeature; // TODO change to dev thing

export const userHasPostAutosave = isLWorAF ? adminOnly : disabled;

// Non-user-specific features
export const dialoguesEnabled = hasDialoguesSetting.get();
export const ckEditorUserSessionsEnabled = isLWorAF;
export const inlineReactsHoverEnabled = hasPostInlineReactionsSetting.get(); // EAF would like if free, but not worthwhile
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
<<<<<<< Updated upstream
export const hasAccountDeletionFlow = isEAForum;
export const hasSideComments = hasSideCommentsSetting.get();
export const useElicitApi = false;
export const commentsTableOfContentsEnabled = hasCommentsTableOfContentSetting.get();
export const fullHeightToCEnabled = isLWorAF;
export const hasForumEvents = isEAForum;
export const hasSurveys = isFriendlyUI && !isBotSiteSetting.get();
export const hasCollapsedFootnotes = false; // TODO re-enable for EAF once https://github.com/ForumMagnum/ForumMagnum/issues/10912 is fixed
export const useCurationEmailsCron = isLW;
export const hasSidenotes = isLWorAF;
export const visitedLinksHaveFilledInCircle = isLWorAF;
export const hasWikiLenses = isLWorAF;
export const hasSubforums = isEAForum;
export const hasPolls = isEAForum;
export const hasDraftComments = isEAForum;
=======
export const hasAccountDeletionFlow = isEAForum; // LW may adopt
export const hasSideComments = hasSideCommentsSetting.get(); // EAF may adopt
export const useElicitApi = false; // Can remove
export const commentsTableOfContentsEnabled = hasCommentsTableOfContentSetting.get(); // EAF may adopt
export const fullHeightToCEnabled = isLWorAF; // EAF will not adopt
export const hasForumEvents = isEAForum; // LW will probably not adopt
export const hasSurveys = isFriendlyUI && !isBotSiteSetting.get(); // LW will not adopt
export const hasCollapsedFootnotes = !isLWorAF; // LW will not adopt
export const useCurationEmailsCron = isLW; // Major product decision (Logic is "Curating is creating common knowledge"). Maybe we should offer people the option.
export const hasSidenotes = isLWorAF; // EAF will not adopt
export const visitedLinksHaveFilledInCircle = isLWorAF; // Seems good, EAF will adopt
export const hasWikiLenses = isLWorAF; // EAF will not adopt
export const hasSubforums = isEAForum; // LW will not adopt
export const hasPolls = isEAForum; // LW may adopt, probably not
export const hasDraftComments = isEAForum; // LW will probably adopt
>>>>>>> Stashed changes

// EA Forum disabled the author's ability to moderate posts. We disregard this
// check in tests as the tests run in EA Forum mode, but we want to be able to
// test the moderation features.
export const hasAuthorModeration = !isEAForum || isAnyTest;

export const userCanCreateAndEditJargonTerms = (user: UsersCurrent|DbUser|null) => isLW && !!user && user.karma >= 100;
export const userCanViewJargonTerms = (user: UsersCurrent|DbUser|UpdateUserDataInput|null) => isLW;
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
