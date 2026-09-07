import { z } from 'zod';
import { allFeedItemSourceTypes } from '@/components/ultraFeed/ultraFeedTypes';
import type { FeedCommentMetaInfo, FeedPostMetaInfo } from '@/components/ultraFeed/ultraFeedTypes';

const contextSchema = z.object({
  offset: z.number().int().min(0),
  history: z.array(z.object({
    position: z.number().int().min(0),
    itemType: z.enum(['post', 'commentThread', 'subscriptionSuggestions']),
    sources: z.array(z.enum(allFeedItemSourceTypes)).max(16),
    userSubscribedToAuthor: z.boolean(),
  })).max(20),
});
export type UltraFeedDiversityContext = z.infer<typeof contextSchema>;

export function parseUltraFeedDiversityContext(value: unknown): UltraFeedDiversityContext | undefined {
  const result = contextSchema.safeParse(value);
  return result.success ? result.data : undefined;
}

/** Only ranking summaries are sent back; no read logging is needed, including in incognito. */
export function buildUltraFeedDiversityContext(results: Array<{ type: string; [key: string]: unknown }>): UltraFeedDiversityContext {
  return { offset: results.length, history: results.slice(-20).map((result, index) => {
    const position = results.length - Math.min(20, results.length) + index;
    if (result.type === 'feedCommentThread') {
      const thread = result.feedCommentThread as { commentMetaInfos?: Record<string, FeedCommentMetaInfo> };
      const comments = Object.values(thread.commentMetaInfos ?? {});
      return { position, itemType: 'commentThread' as const,
        sources: [...new Set(comments.flatMap(comment => comment.sources ?? []))],
        userSubscribedToAuthor: comments.some(comment => comment.fromSubscribedUser),
      };
    }
    const post = result.feedPost as { postMetaInfo?: FeedPostMetaInfo } | undefined;
    const sources = result.type === 'feedSpotlight' ? ['spotlights' as const] : post?.postMetaInfo?.sources ?? [];
    return { position, itemType: result.type === 'feedSubscriptionSuggestions' ? 'subscriptionSuggestions' as const : 'post' as const,
      sources, userSubscribedToAuthor: sources.includes('subscriptionsPosts'),
    };
  }) };
}
