import type { ForumTypeString } from '@/lib/instanceSettings';
import { getSiteUrl } from '../../vulcan-lib/utils';
import { getWithLoader } from '@/lib/loaders';

export const SHOW_NEW_SEQUENCE_KARMA_THRESHOLD = 100;

export interface SequencePostId {
  sequenceId: string,
  postId: string
}

// TODO: Make these functions able to use loaders for caching.

export const sequenceGetPageUrl = function(sequence: {_id: string}){
  return `/s/${sequence._id}`;
};

export const getCollectionOrSequenceUrl = function (sequence: Pick<DbSequence, '_id'|'canonicalCollectionSlug'>) {
  if (!sequence.canonicalCollectionSlug) return sequenceGetPageUrl(sequence)
  
  return `/${sequence.canonicalCollectionSlug}#${sequence._id}`
}

export const sequenceGetAbsolutePageUrl = (sequence: {_id: string}, forumType: ForumTypeString): string => {
  return getSiteUrl(forumType).slice(0, -1) + sequenceGetPageUrl(sequence);
};

export const getAbsoluteCollectionOrSequenceUrl = (sequence: Pick<DbSequence, '_id'|'canonicalCollectionSlug'>, forumType: ForumTypeString): string => {
  return getSiteUrl(forumType).slice(0, -1) + getCollectionOrSequenceUrl(sequence);
};

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
