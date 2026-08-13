import { FLAGGED_FOR_N_DMS, AUTO_BLOCKED_FROM_SENDING_DMS } from "@/lib/collections/moderatorActions/constants";
import { areAllContentPermissionsDisabled } from "./helpers";
import maxBy from "lodash/maxBy";

export const highlightableModeratorActions = ['approve', 'snoozeCustom', 'approveCurrentOnly', 'remove', 'purge', 'disablePermissions', 'disableMessages'] as const;

export type HighlightableModeratorAction = typeof highlightableModeratorActions[number];

export interface ActionHighlightContext {
  user: SunshineUsersList;
  moderatorActions: ModeratorActionDisplay[];
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
}

type ActionHighlightRule = (ctx: ActionHighlightContext) => boolean;

const LLM_SCORE_HIGHLIGHT_THRESHOLD = 0.2;

const getLlmScore = (item: SunshinePostsList | SunshineCommentsList) => item.automatedContentEvaluations?.pangramScore ?? 0;

const isUnapproved = (item: SunshinePostsList | SunshineCommentsList) => !item.rejected && item.authorIsUnreviewed;

/** The user has content awaiting review, and none of it looks LLM-written */
const hasOnlyLowLlmScoreUnapprovedContent: ActionHighlightRule = ({ posts, comments }) => {
  const unapprovedContents = [...posts, ...comments].filter(isUnapproved);
  return unapprovedContents.length >= 1 && !unapprovedContents.some(c => getLlmScore(c) > LLM_SCORE_HIGHLIGHT_THRESHOLD);
};

const ACTION_HIGHLIGHT_RULES: Record<HighlightableModeratorAction, ActionHighlightRule> = {
  approve: hasOnlyLowLlmScoreUnapprovedContent,
  snoozeCustom: hasOnlyLowLlmScoreUnapprovedContent,
  approveCurrentOnly: hasOnlyLowLlmScoreUnapprovedContent,
  // Everything the user has submitted has already been either approved or rejected
  remove: ({ posts, comments }) => {
    const allContents = [...posts, ...comments];
    return !allContents.some(isUnapproved);
  },
  // The user has no approved content
  purge: ({ posts, comments }) => {
    const allContents = [...posts, ...comments];
    return !allContents.some(c => !c.rejected && !c.authorIsUnreviewed);
  },
  // The user has at least two rejected contents, or their most recent content is rejected.
  // (The button toggles to "Enable Permissions" once everything is disabled, so don't suggest it then.)
  disablePermissions: ({ user, posts, comments }) => {
    if (areAllContentPermissionsDisabled(user)) return false;
    const allContents = [...posts, ...comments];
    const rejectedContents = allContents.filter(c => c.rejected);
    if (rejectedContents.length >= 2) return true;
    const mostRecentContent = maxBy(allContents, c => new Date(c.postedAt).getTime());
    return !!mostRecentContent?.rejected;
  },
  // Same trigger as the "Lotsa DMs" message template
  disableMessages: ({ user, moderatorActions }) => {
    if (user.conversationsDisabled) return false;
    return moderatorActions.some(a => a.active && (a.type === FLAGGED_FOR_N_DMS || a.type === AUTO_BLOCKED_FROM_SENDING_DMS));
  },
};

export function getHighlightedModeratorActions(ctx: ActionHighlightContext): Set<HighlightableModeratorAction> {
  const highlighted = new Set<HighlightableModeratorAction>();
  for (const action of highlightableModeratorActions) {
    try {
      if (ACTION_HIGHLIGHT_RULES[action](ctx)) highlighted.add(action);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Error evaluating highlight rule for moderator action "${action}":`, e);
    }
  }
  return highlighted;
}
