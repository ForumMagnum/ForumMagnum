import type { HighlightRule, HighlightRuleOverrides, ModeratorActionHighlightLevel } from "@/lib/moderatorHighlights/highlightRuleTypes";
import { ALWAYS, booleanCondition, evaluateActionHighlightRule, numberCondition, resolveHighlightRules } from "./declarativeHighlightRules";
import { HIGH_PANGRAM_SCORE } from "./highlightSignals";

export const highlightableModeratorActions = ['approve', 'snoozeCustom', 'approveCurrentOnly', 'remove', 'purge', 'disablePermissions', 'disableMessages'] as const;

export type HighlightableModeratorAction = typeof highlightableModeratorActions[number];

/**
 * Highlighted moderator actions come in two layers:
 * - Level 1: the action just shows up above the fold (while the section is collapsed) in its
 *   normal styling, and gets a somewhat darker outline in the expanded view.
 * - Level 2: the action's outline changes to a per-action color (see
 *   `moderatorActionHighlightColors`) in both the collapsed and expanded views.
 *
 * Highlights default to level 1; rules only reach level 2 when there's particular evidence
 * that the action should apply (e.g. actual rejections, or affirmatively human LLM scores),
 * rather than just a compatible absence of information.
 *
 * All of these rules are thresholds on signals (see highlightSignals.ts), so they're editable
 * from /admin/supermodHighlights.
 */

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

export const moderatorActionHighlightLabels: Record<HighlightableModeratorAction, string> = {
  approve: "Approve",
  snoozeCustom: "Snooze",
  approveCurrentOnly: "Approve current content only",
  remove: "Remove from queue",
  purge: "Purge",
  disablePermissions: "Disable permissions",
  disableMessages: "Disable messages",
};

export interface ActionHighlightContext {
  user: SunshineUsersList;
  moderatorActions: ModeratorActionDisplay[];
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
  ruleOverrides?: HighlightRuleOverrides | null;
}

const APPROVE_MIN_APPROVED_CONTENTS = 2;
const APPROVE_MIN_KARMA = 10;

/**
 * The user has content awaiting review, and none of it looks LLM-written. Level 2 when every
 * unapproved content has actually been scored (particular evidence, rather than just an
 * absence of high scores).
 */
const hasCleanUnapprovedContent = [
  numberCondition('unapprovedContentCount', 'gte', 1),
  numberCondition('maxPangramScoreAmongUnapproved', 'lte', HIGH_PANGRAM_SCORE),
];

const allUnapprovedContentScored = [[numberCondition('unapprovedContentMissingPangramScoreCount', 'eq', 0)]];

/**
 * Approving applies to the user's future content too, so it additionally requires some
 * track record — either already-approved contents or a bit of karma — and no negative
 * average score on either their posts or their comments.
 */
const hasTrackRecord = [
  numberCondition('averagePostKarma', 'gte', 0),
  numberCondition('averageCommentKarma', 'gte', 0),
];

export const DEFAULT_ACTION_HIGHLIGHT_RULES: Record<HighlightableModeratorAction, HighlightRule> = {
  approve: {
    enabled: true,
    groups: [
      [...hasTrackRecord, numberCondition('approvedContentCount', 'gte', APPROVE_MIN_APPROVED_CONTENTS), ...hasCleanUnapprovedContent],
      [...hasTrackRecord, numberCondition('userKarma', 'gte', APPROVE_MIN_KARMA), ...hasCleanUnapprovedContent],
    ],
    level2Groups: allUnapprovedContentScored,
  },
  snoozeCustom: {
    enabled: true,
    groups: [hasCleanUnapprovedContent],
    level2Groups: allUnapprovedContentScored,
  },
  approveCurrentOnly: {
    enabled: true,
    groups: [hasCleanUnapprovedContent],
    level2Groups: allUnapprovedContentScored,
  },
  // Everything the user has submitted has already been either approved or rejected.
  // Level 2 when that's the result of actual rejections rather than just having no pending content.
  remove: {
    enabled: true,
    groups: [[numberCondition('unapprovedContentCount', 'eq', 0)]],
    level2Groups: [[numberCondition('rejectedContentCount', 'gte', 1)]],
  },
  // The user has no approved content. Level 2 when multiple contents were actually rejected.
  purge: {
    enabled: true,
    groups: [[numberCondition('approvedContentCount', 'eq', 0)]],
    level2Groups: [[numberCondition('rejectedContentCount', 'gte', 2)]],
  },
  // Level 2 when the user has at least two rejected contents; level 1 when just their most
  // recent content is rejected. (The button toggles to "Enable Permissions" once everything
  // is disabled, so don't suggest it then.)
  disablePermissions: {
    enabled: true,
    groups: [
      [booleanCondition('allContentPermissionsDisabled', false), numberCondition('rejectedContentCount', 'gte', 2)],
      [booleanCondition('allContentPermissionsDisabled', false), booleanCondition('mostRecentContentIsRejected', true)],
    ],
    level2Groups: [[numberCondition('rejectedContentCount', 'gte', 2)]],
  },
  // Same trigger as the "Lotsa DMs" message template; the flag itself is particular evidence.
  disableMessages: {
    enabled: true,
    groups: [[booleanCondition('conversationsDisabled', false), numberCondition('activeDmFlagCount', 'gte', 1)]],
    level2Groups: ALWAYS,
  },
};

export function getHighlightedModeratorActions(ctx: ActionHighlightContext): Map<HighlightableModeratorAction, ModeratorActionHighlightLevel> {
  const rules = resolveHighlightRules(DEFAULT_ACTION_HIGHLIGHT_RULES, ctx.ruleOverrides, 'actions');
  const signalContext = { ...ctx, focusedContent: null };
  const highlighted = new Map<HighlightableModeratorAction, ModeratorActionHighlightLevel>();
  for (const action of highlightableModeratorActions) {
    const rule = rules[action];
    if (!rule) continue;
    try {
      const level = evaluateActionHighlightRule(rule, signalContext);
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
