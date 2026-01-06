import { getSiteUrl } from '../../vulcan-lib/utils';
import type { RouterLocation } from '../../vulcan-lib/routes';
import type { Request, Response } from 'express';
import { getWithLoader } from '@/lib/loaders';

export const SHOW_NEW_SEQUENCE_KARMA_THRESHOLD = 100;

export interface SequencePostId {
  sequenceId: string,
  postId: string
}

// TODO: Make these functions able to use loaders for caching.

export const sequenceGetPageUrl = function(sequence: {_id: string}, isAbsolute = false){
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';

  return `${prefix}/s/${sequence._id}`;
};

export const getCollectionOrSequenceUrl = function (sequence: SequencesPageTitleFragment, isAbsolute = false) {
  if (!sequence.canonicalCollectionSlug) return sequenceGetPageUrl(sequence, isAbsolute)
  
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

export const sequenceRouteWillDefinitelyReturn200 = async (req: Request, res: Response, parsedRoute: RouterLocation, context: ResolverContext) => {
  const sequenceId = parsedRoute.params._id;
  if (!sequenceId) return false;
  return await context.repos.sequences.sequenceRouteWillDefinitelyReturn200(sequenceId);
}
