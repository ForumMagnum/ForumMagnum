import type { ModeratorActionHighlightLevel } from "@/lib/moderatorHighlights/highlightRuleTypes";
import { highlightRuleOverrides } from "@/lib/moderatorHighlights/highlightRules";
import { evaluateActionHighlightRule } from "./declarativeHighlightRules";
import type { HighlightContext } from "./highlightSignals";

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

export function getHighlightedModeratorActions(ctx: HighlightContext): HighlightedModeratorActions {
  const rules = highlightRuleOverrides.actions;
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
