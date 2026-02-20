import { getUserPingbackBySlug, getPostPingbackById, getPostPingbackBySlug, getTagPingbackBySlug, getPostPingbackByLegacyId } from '@/lib/pingback';
import { aboutPostIdSetting, faqPostIdSetting, contactPostIdSetting } from '@/lib/instanceSettings';
import type { RouterLocation } from './parseRoute';
import type { ParamMap } from '../../../../.next/types/routes';

interface PingbackDocument {
  collectionName: CollectionNameString,
  documentId: string,
}

export type GetPingbackFunction = (parsedUrl: RouterLocation, context: ResolverContext) => Promise<PingbackDocument|null> | PingbackDocument|null

// ea-forum-look-here
const legacyRouteAcronym = 'lw';

const getTagPingbackByTagCatchAll = (parsedUrl: RouterLocation, context: ResolverContext) => {
  const slugPath = parsedUrl.params.slug;
  if (!slugPath) {
    return null;
  }

  const segments = slugPath.split('/');
  const slug = segments[0];
  if (!slug) {
    return null;
  }

  // The `'/tag/[[...slug]]'` route can represent `/tag/:slug` and
  // `/tag/:slug/discussion`; we ignore all other shapes.
  if (segments.length === 1 || (segments.length === 2 && segments[1] === 'discussion')) {
    return getTagPingbackBySlug(parsedUrl, slug, context);
  }

  return null;
};

type NextExistingRoute = keyof ParamMap;

export const routePingbackMapping = {
  '/users/[slug]': getUserPingbackBySlug,
  '/collaborateOnPost': (parsedUrl) => getPostPingbackById(parsedUrl, parsedUrl.query.postId),
  '/s/[_id]/p/[postId]': (parsedUrl) => getPostPingbackById(parsedUrl, parsedUrl.params.postId),
  '/highlights/[slug]': (parsedUrl, context) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
  '/w/[slug]': (parsedUrl, context) => getTagPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
  '/w/[slug]/discussion': (parsedUrl, context) => getTagPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
  '/tag/[[...slug]]': getTagPingbackByTagCatchAll,
  '/about': (parsedUrl) => getPostPingbackById(parsedUrl, aboutPostIdSetting.get()),
  '/contact': (parsedUrl) => getPostPingbackById(parsedUrl, contactPostIdSetting.get()),
  '/faq': (parsedUrl) => getPostPingbackById(parsedUrl, faqPostIdSetting.get()),
  '/donate': (parsedUrl) => getPostPingbackById(parsedUrl, "LcpQQvcpWfPXvW7R9"),
  '/hpmor/[slug]': (parsedUrl, context) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
  '/codex/[slug]': (parsedUrl, context) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
  '/rationality/[slug]': (parsedUrl, context) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
  '/events/[_id]': (parsedUrl) => getPostPingbackById(parsedUrl, parsedUrl.params._id),
  '/events/[_id]/[slug]': (parsedUrl) => getPostPingbackById(parsedUrl, parsedUrl.params._id),
  '/g/[groupId]/p/[_id]': (parsedUrl) => getPostPingbackById(parsedUrl, parsedUrl.params._id),
  '/posts/[_id]': (parsedUrl) => getPostPingbackById(parsedUrl, parsedUrl.params._id),
  '/posts/[_id]/[slug]': (parsedUrl) => getPostPingbackById(parsedUrl, parsedUrl.params._id),
  '/posts/slug/[slug]': (parsedUrl, context) => getPostPingbackBySlug(parsedUrl, parsedUrl.params.slug, context),
  [`/${legacyRouteAcronym}/[id]`]: (parsedUrl, context) => getPostPingbackByLegacyId(parsedUrl, parsedUrl.params.id, context),
  [`/${legacyRouteAcronym}/[id]/[slug]`]: (parsedUrl, context) => getPostPingbackByLegacyId(parsedUrl, parsedUrl.params.id, context),
} satisfies Partial<Record<NextExistingRoute, GetPingbackFunction>>;

export type PingbackRoutePattern = keyof typeof routePingbackMapping;
