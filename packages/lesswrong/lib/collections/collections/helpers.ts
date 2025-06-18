import { getSiteUrl } from '../../vulcan-lib/utils';

export const collectionGetPageUrl = (collection: { slug: string }, isAbsolute?: boolean): string => {
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';
  return `${prefix}/${collection.slug}`;
}
