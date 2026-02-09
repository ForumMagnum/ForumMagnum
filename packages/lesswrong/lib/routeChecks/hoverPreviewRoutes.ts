import { CommentLinkPreviewLegacy, MessagePreview, PostCommentLinkPreviewGreaterWrong, PostLinkPreview, PostLinkPreviewLegacy, PostLinkPreviewSequencePost, PostLinkPreviewSlug, SequencePreview } from '@/components/linkPreview/PostLinkPreview';
import { TagHoverPreview } from '@/components/tagging/TagHoverPreview';
import type { RouterLocation } from '@/lib/routeChecks/parseRoute';

// ea-forum-look-here
// This matches directory structure in app/lw which will need to be duplicated as app/ea
const legacyRouteAcronym = 'lw';

export type LinkPreviewComponent = React.FC<{
  href: string,
  originalHref: string,
  targetLocation: RouterLocation,
  id: string,
  className?: string,
  noPrefetch?: boolean,
  children: React.ReactNode,
}>

export const routePreviewComponentMapping: Record<string,LinkPreviewComponent> = {
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
  [`/${legacyRouteAcronym}/:id/:slug?`]: PostLinkPreviewLegacy,
    // TODO: Pingback with getPostPingbackByLegacyId
  [`/${legacyRouteAcronym}/:id/:slug/:commentId`]: CommentLinkPreviewLegacy,
  '/inbox/:conversationId': MessagePreview,
  '/inbox': MessagePreview,
}
