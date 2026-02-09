import { getUserPingbackBySlug, getPostPingbackById, getPostPingbackBySlug, getTagPingbackBySlug, getPostPingbackByLegacyId } from '@/lib/pingback';
import { aboutPostIdSetting, faqPostIdSetting, contactPostIdSetting } from '@/lib/instanceSettings';
import type { RouterLocation } from './parseRoute';

interface PingbackDocument {
  collectionName: CollectionNameString,
  documentId: string,
}

export type GetPingbackFunction = (parsedUrl: RouterLocation, context: ResolverContext) => Promise<PingbackDocument|null> | PingbackDocument|null

// ea-forum-look-here
const legacyRouteAcronym = 'lw';

export const routePingbackMapping = {
  '/users/:slug': getUserPingbackBySlug,
  '/collaborateOnPost': (parsedUrl) => getPostPingbackById(parsedUrl, parsedUrl.query.postId),
  '/s/:sequenceId/p/:postId': (parsedUrl) => getPostPingbackById(parsedUrl, parsedUrl.params.postId),
  '/highlights/:slug': (parsedUrl, context) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
  '/w/:slug': (parsedUrl, context) => getTagPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
  '/w/:slug/discussion': (parsedUrl, context) => getTagPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
  '/tag/:slug': (parsedUrl, context) => getTagPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
  '/tag/:slug/discussion': (parsedUrl, context) => getTagPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
  '/about': (parsedUrl) => getPostPingbackById(parsedUrl, aboutPostIdSetting.get()),
  '/contact': (parsedUrl) => getPostPingbackById(parsedUrl, contactPostIdSetting.get()),
  '/faq': (parsedUrl) => getPostPingbackById(parsedUrl, faqPostIdSetting.get()),
  '/donate': (parsedUrl) => getPostPingbackById(parsedUrl, "LcpQQvcpWfPXvW7R9"),
  '/hpmor/:slug': (parsedUrl, context) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
  '/codex/:slug': (parsedUrl, context) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
  '/rationality/:slug': (parsedUrl, context) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
  '/events/:_id/:slug?': (parsedUrl) => getPostPingbackById(parsedUrl, parsedUrl.params._id),
  '/g/:groupId/p/:_id': (parsedUrl) => getPostPingbackById(parsedUrl, parsedUrl.params._id),
  '/posts/:_id/:slug?': (parsedUrl) => getPostPingbackById(parsedUrl, parsedUrl.params._id),
  '/posts/slug/:slug?': (parsedUrl, context) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
  [`/${legacyRouteAcronym}/:id/:slug?`]: (parsedUrl, context) => getPostPingbackByLegacyId(parsedUrl, parsedUrl.params.id, context),
} satisfies Record<string, GetPingbackFunction>;
