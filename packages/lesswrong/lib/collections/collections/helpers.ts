import { getSiteUrl } from '../../vulcan-lib/utils';
import { sequenceGetAllPostIDs } from '../sequences/helpers';
import toDictionary from '../../utils/toDictionary';
import * as _ from 'underscore';

export const collectionGetAllPostIDs = async (collectionID: string, context: ResolverContext): Promise<Array<string>> => {
  const { Books } = context;
  const books = await Books.find({collectionId: collectionID}).fetch();
  const sequenceIDs = _.flatten(books.map(book=>book.sequenceIds));
  
  const sequencePostsPairs = await Promise.all(
    sequenceIDs.map(async seqID => [seqID, await sequenceGetAllPostIDs(seqID, context)])
  );
  const postsBySequence = toDictionary(sequencePostsPairs, pair=>pair[0], pair=>pair[1]);
  
  const posts = _.flatten(books.map(book => {
    const postsInSequencesInBook = _.flatten(
      _.map(book.sequenceIds, sequenceId => postsBySequence[sequenceId])
    );
    if (book.postIds)
      return _.union(book.postIds, postsInSequencesInBook);
    else
      return postsInSequencesInBook;
  }));
  return posts;
};

export const collectionGetPageUrl = (collection: { slug: string }, isAbsolute?: boolean): string => {
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';
  return `${prefix}/${collection.slug}`;
}
