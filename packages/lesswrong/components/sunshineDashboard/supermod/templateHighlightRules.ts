import { FLAGGED_FOR_N_DMS, AUTO_BLOCKED_FROM_SENDING_DMS, RECENTLY_DOWNVOTED_CONTENT_ALERT, SENT_MODERATOR_MESSAGE } from "@/lib/collections/moderatorActions/constants";

export interface TemplateHighlightContext {
  user: SunshineUsersList;
  moderatorActions: ModeratorActionDisplay[];
  posts: SunshinePostsList[];
  comments: SunshineCommentsList[];
}

type HighlightRule = (ctx: TemplateHighlightContext) => boolean;

const TEMPLATE_HIGHLIGHT_RULES: Record<string, HighlightRule> = {
  "Lotsa DMs": ({ moderatorActions }) => {
    const flaggedForNDMs = moderatorActions.filter(a => a.active && a.type === FLAGGED_FOR_N_DMS);
    const autoBlockedFromSendingDMs = moderatorActions.filter(a => a.active && a.type === AUTO_BLOCKED_FROM_SENDING_DMS);
    return flaggedForNDMs.length >= 1 || autoBlockedFromSendingDMs.length >= 1;
  },
  "This isn't gonna work out": ({ moderatorActions }) => {
    const moderatorMessages = moderatorActions.filter(a => a.type === SENT_MODERATOR_MESSAGE);
    return moderatorMessages.length >= 2;
  },
  "Multiple LLM rejections": ({ moderatorActions, posts }) => {
    const moderatorMessages = moderatorActions.filter(a => a.type === SENT_MODERATOR_MESSAGE);
    const highLLMPosts = posts.filter(p => (p.automatedContentEvaluations?.pangramScore ?? 0) >= .2);
    return highLLMPosts.length >= 2 && moderatorMessages.length >= 2;
  },
  "Semi-automoderated quality warning (downvoted)": ({ moderatorActions }) =>
    moderatorActions.some(a => a.active && a.type === RECENTLY_DOWNVOTED_CONTENT_ALERT),
};

export function getHighlightedTemplateNames(
  ctx: Omit<TemplateHighlightContext, 'posts' | 'comments'>,
  posts: SunshinePostsList[],
  comments: SunshineCommentsList[]
): Set<string> {
  const fullCtx: TemplateHighlightContext = {
    ...ctx,
    posts,
    comments,
  };
  const highlighted = new Set<string>();
  for (const [name, condition] of Object.entries(TEMPLATE_HIGHLIGHT_RULES)) {
    try {
      if (condition(fullCtx)) highlighted.add(name);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Error evaluating highlight rule for "${name}":`, e);
    }
  }
  return highlighted;
}
