import { parseRoute, parsePath } from '@/lib/vulcan-lib/routes';
import { PostCommentLinkPreviewGreaterWrong, PostLinkPreview, PostLinkPreviewSequencePost, PostLinkPreviewSlug, SequencePreview } from './PostLinkPreview';
import { TagHoverPreview } from '../tagging/TagHoverPreview';

export const routePreviewComponentMapping = {
  '/sequences/:_id': SequencePreview,
  '/s/:_id': SequencePreview,
  '/s/:sequenceId/p/:postId': PostLinkPreviewSequencePost,
  '/highlights/:slug': PostLinkPreviewSlug,
  '/w/:slug': TagHoverPreview,
  '/w/:slug/discussion': TagHoverPreview,
  '/hpmor/:slug': PostLinkPreviewSlug,
  '/codex/:slug': PostLinkPreviewSlug,
  '/rationality/:slug': PostLinkPreviewSlug,
  '/events/:_id/:slug?': PostLinkPreview,
  '/g/:groupId/p/:_id': PostLinkPreview,
  '/posts/:_id/:slug?': PostLinkPreview,
  '/posts/slug/:slug?': PostLinkPreviewSlug,
  '/posts/:_id/:slug/comment/:commentId?': PostCommentLinkPreviewGreaterWrong,
};


export const parseRouteWithErrors = <const T extends string[] | [] = []>(onsiteUrl: string, extraRoutePatterns?: T) => {
  return parseRoute<((keyof typeof routePreviewComponentMapping) | T[number])[]>({
    location: parsePath(onsiteUrl),
    onError: (pathname) => {
      // Don't capture broken links in Sentry (too spammy, but maybe we'll
      // put this back some day).
      //if (isClient) {
      //  if (contentSourceDescription)
      //    Sentry.captureException(new Error(`Broken link from ${contentSourceDescription} to ${pathname}`));
      //  else
      //    Sentry.captureException(new Error(`Broken link from ${location.pathname} to ${pathname}`));
      //}
    },
    routePatterns: [
      ...Object.keys(routePreviewComponentMapping).reverse() as (keyof typeof routePreviewComponentMapping)[],
      ...(extraRoutePatterns ?? [])
    ]
  });
};
