import type { ForumTypeString } from '@/lib/instanceSettings';
import { getSiteUrl } from '../../vulcan-lib/utils';

export const collectionGetPageUrl = (collection: { slug: string }): string => {
  return `/${collection.slug}`;
}

export const collectionGetAbsolutePageUrl = (collection: {slug: string}, forumType: ForumTypeString): string => {
  return getSiteUrl(forumType).slice(0, -1) + collectionGetPageUrl(collection);
};
