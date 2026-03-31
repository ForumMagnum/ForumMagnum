import { getSiteUrl } from '../../vulcan-lib/utils';
import { getWithLoader } from '@/lib/loaders';

export const SHOW_NEW_SEQUENCE_KARMA_THRESHOLD = 100;

export interface SequencePostId {
  sequenceId: string,
  postId: string
}

// TODO: Make these functions able to use loaders for caching.

interface SequenceMinimumForGetPageUrl {
  _id: string
  slug: string
}
interface SequenceGetPageUrlOptions {
  isAbsolute?: boolean,
  isApiVersion?: boolean,
}
export const sequenceGetPageUrl = function(sequence: SequenceMinimumForGetPageUrl, options?: SequenceGetPageUrlOptions){
  const isAbsolute = options?.isAbsolute ?? false;
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';

  return `${prefix}/s/${sequence.slug}`;
};

export const getCollectionOrSequenceUrl = function (sequence: Pick<DbSequence, '_id'|'slug'|'canonicalCollectionSlug'>, options?: SequenceGetPageUrlOptions) {
  if (!sequence.canonicalCollectionSlug) return sequenceGetPageUrl(sequence, options)
  
  const isAbsolute = options?.isAbsolute ?? false;
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';
  return `${prefix}/${sequence.canonicalCollectionSlug}#${sequence._id}`
}

export const getCollectionBySlug = async (slug: string, context: ResolverContext) => {
  const { Collections } = context;
  const result = await getWithLoader(
    context, Collections, "collectionBySlug",
    {},
    "slug", slug
  );
  return result[0] ?? null;
}

export const getSequenceCollectionBooks = async function(sequenceId: string, context: ResolverContext) {
  const sequence = await context.loaders.Sequences.load(sequenceId);
  if (!sequence?.canonicalCollectionSlug) return;

  const { canonicalCollectionSlug } = sequence;

  const collection = await getCollectionBySlug(canonicalCollectionSlug, context);
  if (!collection) return;

  const { _id: collectionId } = collection;

  return context.Books.find({ collectionId }, { sort: { number: 1 } }).fetch();
}
