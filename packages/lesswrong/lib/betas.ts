// Centralized control of beta-gated features. If a feature is restricted to
// admins or to users with the opt-in flag, implement that by defining a
// function here which returns whether a given user has access to that feature.
// That way, we can look here to see what features are currently beta-gated,
// and have an easy way to un-gate in all the relevant places at once.
//
// Beta-feature test functions must handle the case where user is null.

import { testServerSetting, isEAForum } from "./instanceSettings";

// States for in-progress features
const adminOnly = (user: UsersCurrent|DbUser|null): boolean => !!user?.isAdmin; // eslint-disable-line no-unused-vars
const moderatorOnly = (user: UsersCurrent|DbUser|null): boolean => !!(user?.isAdmin || user?.groups?.includes('sunshineRegiment'))
const optInOnly = (user: UsersCurrent|DbUser|null): boolean => !!user?.beta; // eslint-disable-line no-unused-vars
const shippedFeature = (user: UsersCurrent|DbUser|null): boolean => true; // eslint-disable-line no-unused-vars
const disabled = (user: UsersCurrent|DbUser|null): boolean => false; // eslint-disable-line no-unused-vars
const karmaGated = (minKarma: number) => (user: UsersCurrent|DbUser|null): boolean => user ? user.karma>=minKarma : false;
const testServerOnly = (_: UsersCurrent|DbUser|null): boolean => testServerSetting.get();

//////////////////////////////////////////////////////////////////////////////
// Features in progress                                                     //
//////////////////////////////////////////////////////////////////////////////

export const userHasCommentOnSelection = isEAForum ? disabled : shippedFeature;
export const userCanEditTagPortal = isEAForum ? moderatorOnly : adminOnly;
export const userHasBoldPostItems = disabled
export const userHasEAHomeHandbook = adminOnly
export const userCanCreateCommitMessages = moderatorOnly;
export const userHasRedesignedSettingsPage = disabled;
export const userCanUseSharing = (user: UsersCurrent|DbUser|null): boolean => moderatorOnly(user) || karmaGated(1)(user)
export const userHasNewTagSubscriptions =  isEAForum ? shippedFeature : disabled
export const userHasDefaultProfilePhotos = disabled

export const userHasAutosummarize = adminOnly

export const userHasThemePicker = isEAForum ? adminOnly : shippedFeature;

export const userHasSideComments = isEAForum ? disabled : shippedFeature;

export const userHasShortformTags = isEAForum ? shippedFeature : disabled;

export const userHasCommentProfileImages = disabled;

export const userHasEagProfileImport = disabled;

export const userHasPopularCommentsSection = isEAForum ? adminOnly : disabled;

// Shipped Features
export const userCanManageTags = shippedFeature;
export const userCanCreateTags = shippedFeature;
export const userCanUseTags = shippedFeature;
export const userCanViewRevisionHistory = shippedFeature;
export const userHasPingbacks = shippedFeature;
export const userHasElasticsearch = shippedFeature;
