import { FLAGGED_FOR_N_DMS, AUTO_BLOCKED_FROM_SENDING_DMS } from "@/lib/collections/moderatorActions/constants";
import { areAllContentPermissionsDisabled } from "./helpers";
import maxBy from "lodash/maxBy";

export const highlightableModeratorActions = ['approve', 'snoozeCustom', 'approveCurrentOnly', 'remove', 'purge', 'disablePermissions', 'disableMessages'] as const;

export type HighlightableModeratorAction = typeof highlightableModeratorActions[number];

/**
 * Highlighted moderator actions come in two layers:
 * - Level 1: the action just shows up above the fold (while the section is collapsed) in its
 *   normal styling, and gets a somewhat darker outline in the expanded view.
 * - Level 2: the action's outline changes to a per-action color (see
 *   `moderatorActionHighlightColors`) in both the collapsed and expanded views.
 *
 * Highlights default to level 1; rules only return level 2 when there's particular evidence
 * that the action should apply (e.g. actual rejections, or affirmatively human LLM scores),
 * rather than just a compatible absence of information.
 */
export type ModeratorActionHighlightLevel = 1 | 2;

export type ModeratorActionHighlightColor = 'green' | 'gold' | 'black' | 'red';

export type ModeratorActionHighlightStyle = ModeratorActionHighlightColor | 'subtleOutline';

/** Outline colors used when an action is highlighted at level 2 */
export const moderatorActionHighlightColors: Record<HighlightableModeratorAction, ModeratorActionHighlightColor> = {
  approve: 'green',
  snoozeCustom: 'gold',
  approveCurrentOnly: 'gold',
  remove: 'black',
  purge: 'red',
  disablePermissions: 'black',
  disableMessages: 'black',
};

export interface ActionHighlightContext {
  user: SunshineUsersList;
  moderatorActions: ModeratorActionDisplay[];
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
}

type ActionHighlightRule = (ctx: ActionHighlightContext) => ModeratorActionHighlightLevel | null;

const LLM_SCORE_HIGHLIGHT_THRESHOLD = 0.2;

const getLlmScore = (item: SunshinePostsList | SunshineCommentsList) => item.automatedContentEvaluations?.pangramScore ?? 0;

const isUnapproved = (item: SunshinePostsList | SunshineCommentsList) => !item.rejected && item.authorIsUnreviewed;

/**
 * The user has content awaiting review, and none of it looks LLM-written. Level 2 when every
 * unapproved content has actually been evaluated and scored human (particular evidence, rather
 * than just an absence of high scores).
 */
const approveHighlightLevel: ActionHighlightRule = ({ posts, comments }) => {
  const unapprovedContents = [...posts, ...comments].filter(isUnapproved);
  if (unapprovedContents.length === 0) return null;
  if (unapprovedContents.some(c => getLlmScore(c) > LLM_SCORE_HIGHLIGHT_THRESHOLD)) return null;
  const allContentsEvaluatedAsHuman = unapprovedContents.every(c => c.automatedContentEvaluations?.pangramScore != null);
  return allContentsEvaluatedAsHuman ? 2 : 1;
};

const ACTION_HIGHLIGHT_RULES: Record<HighlightableModeratorAction, ActionHighlightRule> = {
  approve: approveHighlightLevel,
  snoozeCustom: approveHighlightLevel,
  approveCurrentOnly: approveHighlightLevel,
  // Everything the user has submitted has already been either approved or rejected.
  // Level 2 when that's the result of actual rejections rather than just having no pending content.
  remove: ({ posts, comments }) => {
    const allContents = [...posts, ...comments];
    if (allContents.some(isUnapproved)) return null;
    const rejectedContents = allContents.filter(c => c.rejected);
    return rejectedContents.length >= 1 ? 2 : 1;
  },
  // The user has no approved content. Level 2 when multiple contents were actually rejected.
  purge: ({ posts, comments }) => {
    const allContents = [...posts, ...comments];
    if (allContents.some(c => !c.rejected && !c.authorIsUnreviewed)) return null;
    const rejectedContents = allContents.filter(c => c.rejected);
    return rejectedContents.length >= 2 ? 2 : 1;
  },
  // Level 2 when the user has at least two rejected contents; level 1 when just their most
  // recent content is rejected. (The button toggles to "Enable Permissions" once everything
  // is disabled, so don't suggest it then.)
  disablePermissions: ({ user, posts, comments }) => {
    if (areAllContentPermissionsDisabled(user)) return null;
    const allContents = [...posts, ...comments];
    const rejectedContents = allContents.filter(c => c.rejected);
    if (rejectedContents.length >= 2) return 2;
    const mostRecentContent = maxBy(allContents, c => new Date(c.postedAt).getTime());
    return mostRecentContent?.rejected ? 1 : null;
  },
  // Same trigger as the "Lotsa DMs" message template; the flag itself is particular evidence.
  disableMessages: ({ user, moderatorActions }) => {
    if (user.conversationsDisabled) return null;
    const flaggedForDMs = moderatorActions.some(a => a.active && (a.type === FLAGGED_FOR_N_DMS || a.type === AUTO_BLOCKED_FROM_SENDING_DMS));
    return flaggedForDMs ? 2 : null;
  },
};

export function getHighlightedModeratorActions(ctx: ActionHighlightContext): Map<HighlightableModeratorAction, ModeratorActionHighlightLevel> {
  const highlighted = new Map<HighlightableModeratorAction, ModeratorActionHighlightLevel>();
  for (const action of highlightableModeratorActions) {
    try {
      const level = ACTION_HIGHLIGHT_RULES[action](ctx);
      if (level) highlighted.set(action, level);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Error evaluating highlight rule for moderator action "${action}":`, e);
    }
  }
  return highlighted;
}

/**
 * Resolves which visual treatment (if any) a highlighted action's button should get.
 * Level 1 actions look normal in the collapsed row (they're highlighted just by being
 * there) and get a somewhat darker outline in the expanded view; level 2 actions get
 * their per-action colored outline in both views.
 */
export function getActionHighlightStyle(
  action: HighlightableModeratorAction,
  level: ModeratorActionHighlightLevel | undefined,
  inCollapsedRow: boolean,
): ModeratorActionHighlightStyle | null {
  if (!level) return null;
  if (level === 2) return moderatorActionHighlightColors[action];
  return inCollapsedRow ? null : 'subtleOutline';
}
