// Centralized control of beta-gated features. If a feature is restricted to
// admins or to users with the opt-in flag, implement that by defining a
// function here which returns whether a given user has access to that feature.
// That way, we can look here to see what features are currently beta-gated,
// and have an easy way to un-gate in all the relevant places at once.
//
// Beta-feature test functions must handle the case where user is null.

// States for in-progress features
const adminOnly = (user: UsersCurrent|DbUser|null): boolean => !!user?.isAdmin; // eslint-disable-line no-unused-vars
const moderatorOnly = (user: UsersCurrent|DbUser|null): boolean => !!(user?.isAdmin || user?.groups?.includes('sunshineRegiment'))
const optInOnly = (user: UsersCurrent|DbUser|null): boolean => !!user?.beta; // eslint-disable-line no-unused-vars
const shippedFeature = (user: UsersCurrent|DbUser|null): boolean => true; // eslint-disable-line no-unused-vars
const disabled = (user: UsersCurrent|DbUser|null): boolean => false; // eslint-disable-line no-unused-vars

// const tagManager = (user: UsersCurrent|DbUser|null): boolean =>
//   !!(user?.isAdmin || user?.groups?.includes('sunshineRegiment') || user?.groups?.includes('tagManager'))

//////////////////////////////////////////////////////////////////////////////
// Features in progress                                                     //
//////////////////////////////////////////////////////////////////////////////

export const userCanEditTagPortal = adminOnly;
export const userHasCkEditor = shippedFeature;
export const userHasCkCollaboration = adminOnly;
export const userHasBoldPostItems = disabled
export const userHasEAHomeHandbook = adminOnly
export const userCanCreateCommitMessages = moderatorOnly;

export const userHasThemePicker = adminOnly

// Shipped Features
export const userCanManageTags = shippedFeature;
export const userCanCreateTags = shippedFeature;
export const userCanUseTags = shippedFeature;
export const userCanViewRevisionHistory = shippedFeature;
export const userHasPingbacks = shippedFeature;
