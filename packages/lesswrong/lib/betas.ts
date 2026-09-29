// Centralized control of beta-gated features. If a feature is restricted to
// admins or to users with the opt-in flag, implement that by defining a
// function here which returns whether a given user has access to that feature.
// That way, we can look here to see what features are currently beta-gated,
// and have an easy way to un-gate in all the relevant places at once.
//
// Beta-feature test functions must handle the case where user is null.

import { type ForumTypeString, isEAForum, userIdsWithAccessToLlmChat } from './instanceSettings';
import { isAdmin } from "./vulcan-users/permissions";
import {isFriendlyUI} from '../themes/forumTheme'

type BetaGate = (user: UsersCurrent | DbUser | null) => boolean;

// States for in-progress features
const adminOnly = (user: UsersCurrent|DbUser|null): boolean => !!user?.isAdmin; // eslint-disable-line no-unused-vars
const moderatorOnly = (user: UsersCurrent|DbUser|null): boolean => !!(user?.isAdmin || user?.groups?.includes('sunshineRegiment'))
const optInOnly = (user: UsersCurrent|DbUser|null): boolean => !!user?.beta; // eslint-disable-line no-unused-vars
const shippedFeature = (user: UsersCurrent|DbUser|null): boolean => true; // eslint-disable-line no-unused-vars
const disabled = (user: UsersCurrent|DbUser|null): boolean => false; // eslint-disable-line no-unused-vars
const adminOrBeta = (user: UsersCurrent|DbUser|null): boolean => adminOnly(user) || optInOnly(user);

//////////////////////////////////////////////////////////////////////////////
// Features in progress                                                     //
//////////////////////////////////////////////////////////////////////////////

export const userCanCreateCommitMessages = moderatorOnly;
export const userCanUseSharing = (user: UsersCurrent|DbUser|null): boolean => !!user;
// TODO: Consider porting EA tag subscriptions (including new-post notifications) to LW/AF.
export const userHasNewTagSubscriptions: BetaGate = (user) => isEAForum() ? shippedFeature(user) : disabled(user);
export const userHasDefaultProfilePhotos = disabled

export const visitorGetsDynamicFrontpage = (user: UsersCurrent | DbUser | null, forumType: ForumTypeString) => forumType === 'LessWrong' ? shippedFeature(user) : disabled(user);

export const userHasSubscribeTabFeed = (user: UsersCurrent | DbUser | null, forumType: ForumTypeString) => forumType === 'LessWrong' ? shippedFeature(user) : disabled(user);

export const userHasLlmChat = (currentUser: UsersCurrent|DbUser|null, forumType: ForumTypeString): currentUser is UsersCurrent|DbUser => {
  if (!currentUser) {
    return false
  }
  const userIdsWithAccess = userIdsWithAccessToLlmChat.get(forumType);
  
  return forumType === 'LessWrong' && (isAdmin(currentUser) || userIdsWithAccess.includes(currentUser._id));
}

// Non-user-specific features
export const dialoguesEnabled = () => true;
export const ckEditorUserSessionsEnabled = () => true;
export const allowSubscribeToUserComments = true;
export const allowSubscribeToSequencePosts = () => isFriendlyUI();

export const hasAccountDeletionFlow = () => false;
export const useElicitApi = false;
export const hasCollapsedFootnotes = false; // TODO re-enable for EAF once https://github.com/ForumMagnum/ForumMagnum/issues/10912 is fixed
export const usesCurationEmailsCron = (forumType: ForumTypeString) => forumType === 'LessWrong';
export const hasWikiLenses = () => true;

export const userCanCreateAndEditJargonTerms = (user: UsersCurrent|DbUser|null, forumType: ForumTypeString) => forumType === 'LessWrong' && !!user && user.karma >= 100;
export const userCanViewJargonTerms = (user: UsersCurrent|DbUser|UpdateUserDataInput|null, forumType: ForumTypeString) => forumType === 'LessWrong';
export const userCanViewUnapprovedJargonTerms = (user: UsersCurrent|DbUser|null, forumType: ForumTypeString) => forumType === 'LessWrong'
/* if this is reduced to 0, we need to make sure to handle spam somehow */
export const userCanPassivelyGenerateJargonTerms = (user: UsersCurrent|DbUser|null, forumType: ForumTypeString) => forumType === 'LessWrong' && !!user && user.karma >= 100
