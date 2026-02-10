import { CommentLinkPreviewLegacy, MessagePreview, PostCommentLinkPreviewGreaterWrong, PostLinkPreview, PostLinkPreviewLegacy, PostLinkPreviewSequencePost, PostLinkPreviewSlug, SequencePreview } from '@/components/linkPreview/PostLinkPreview';
import { TagHoverPreview } from '@/components/tagging/TagHoverPreview';
import type { RouterLocation } from '@/lib/routeChecks/parseRoute';
import type { ParamMap } from '../../../../.next/types/routes';

// ea-forum-look-here
// This matches directory structure in app/lw which will need to be duplicated as app/ea
const legacyRouteAcronym = 'lw';

type NextExistingRoute = keyof ParamMap;

export type LinkPreviewComponent<TRoute extends NextExistingRoute = NextExistingRoute> = React.FC<{
  href: string,
  originalHref: string,
  targetLocation: RouterLocation,
  params: ParamMap[TRoute],
  id: string,
  className?: string,
  noPrefetch?: boolean,
  children: React.ReactNode,
}>

const defineRoutePreviewComponentMapping = <const TRoute extends NextExistingRoute>(
  routePreviewComponentMapping: { [TRoutePattern in TRoute]: LinkPreviewComponent<TRoutePattern> }
) => routePreviewComponentMapping;

export const routePreviewComponentMapping = defineRoutePreviewComponentMapping({
  '/sequences/[_id]': SequencePreview,
  '/s/[_id]': SequencePreview,
  '/s/[_id]/p/[postId]': PostLinkPreviewSequencePost,
  '/highlights/[slug]': PostLinkPreviewSlug,
  '/w/[slug]': TagHoverPreview,
  '/w/[slug]/discussion': TagHoverPreview,
  '/hpmor/[slug]': PostLinkPreviewSlug,
  '/codex/[slug]': PostLinkPreviewSlug,
  '/rationality/[slug]': PostLinkPreviewSlug,
  '/events/[_id]': PostLinkPreview,
  '/events/[_id]/[slug]': PostLinkPreview,
  '/g/[groupId]/p/[_id]': PostLinkPreview,
  '/posts/[_id]': PostLinkPreview,
  '/posts/[_id]/[slug]': PostLinkPreview,
  '/posts/slug/[slug]': PostLinkPreviewSlug,
  '/posts/[_id]/[slug]/comment': PostCommentLinkPreviewGreaterWrong,
  '/posts/[_id]/[slug]/comment/[commentId]': PostCommentLinkPreviewGreaterWrong,
  [`/${legacyRouteAcronym}/[id]`]: PostLinkPreviewLegacy,
  [`/${legacyRouteAcronym}/[id]/[slug]`]: PostLinkPreviewLegacy,
    // TODO: Pingback with getPostPingbackByLegacyId
  [`/${legacyRouteAcronym}/[id]/[slug]/[commentId]`]: CommentLinkPreviewLegacy,
  '/inbox/[conversationId]': MessagePreview,
  '/inbox': MessagePreview,
});

export type RoutePreviewPattern = keyof typeof routePreviewComponentMapping;
export type RoutePreviewParams<TRoutePattern extends RoutePreviewPattern> = ParamMap[TRoutePattern];
