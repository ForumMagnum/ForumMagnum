import type { HighlightRule, ModeratorActionHighlightLevel } from "@/lib/moderatorHighlights/highlightRuleTypes";
import { highlightRuleOverrides } from "@/lib/moderatorHighlights/highlightRules";
import { ALWAYS, booleanCondition, evaluateActionHighlightRule, numberCondition } from "./declarativeHighlightRules";
import { HIGH_PANGRAM_SCORE, type HighlightContext } from "./highlightSignals";

export const highlightableModeratorActions = ['approve', 'snoozeCustom', 'approveCurrentOnly', 'remove', 'purge', 'disablePermissions', 'disableMessages'] as const;

export type HighlightableModeratorAction = typeof highlightableModeratorActions[number];

export type ModeratorActionHighlightColor = 'green' | 'gold' | 'black' | 'red';

export type ModeratorActionHighlightStyle = ModeratorActionHighlightColor | 'subtleOutline';

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

export type HighlightedModeratorActions = Map<HighlightableModeratorAction, ModeratorActionHighlightLevel>;

const APPROVE_MIN_APPROVED_CONTENTS = 2;
const APPROVE_MIN_KARMA = 10;
const PURGE_MAX_CONTENTS = 3;

const hasCleanUnapprovedContent = [
  numberCondition('unapprovedContentCount', 'gte', 1),
  numberCondition('maxPangramScoreAmongUnapproved', 'lte', HIGH_PANGRAM_SCORE),
];

const allUnapprovedContentScored = [[numberCondition('unapprovedContentMissingPangramScoreCount', 'eq', 0)]];

// Average karma is 0 for an empty set, so no posts passes vacuously.
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
  remove: {
    enabled: true,
    groups: [[numberCondition('unapprovedContentCount', 'eq', 0)]],
    level2Groups: [[numberCondition('rejectedContentCount', 'gte', 1)]],
  },
  purge: {
    enabled: true,
    groups: [[
      numberCondition('contentCount', 'lte', PURGE_MAX_CONTENTS),
      numberCondition('approvedContentCount', 'eq', 0),
    ]],
    level2Groups: [[numberCondition('rejectedContentCount', 'gte', 2)]],
  },
  disablePermissions: {
    enabled: true,
    groups: [
      [numberCondition('rejectedContentCount', 'gte', 2)],
      [booleanCondition('mostRecentContentIsRejected', true)],
    ],
    level2Groups: [[numberCondition('rejectedContentCount', 'gte', 2)]],
  },
  disableMessages: {
    enabled: true,
    groups: [[booleanCondition('conversationsDisabled', false), numberCondition('activeDmFlagCount', 'gte', 1)]],
    level2Groups: ALWAYS,
  },
};

export function getHighlightedModeratorActions(ctx: HighlightContext): HighlightedModeratorActions {
  const rules = { ...DEFAULT_ACTION_HIGHLIGHT_RULES, ...highlightRuleOverrides.actions };
  const signalContext = { ...ctx, focusedContent: null };
  const highlighted: HighlightedModeratorActions = new Map();
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

export function getActionHighlightStyle(
  highlightedActions: HighlightedModeratorActions | undefined,
  action: HighlightableModeratorAction,
): ModeratorActionHighlightStyle | null {
  const level = highlightedActions?.get(action);
  if (!level) return null;
  return level === 2 ? moderatorActionHighlightColors[action] : 'subtleOutline';
}
