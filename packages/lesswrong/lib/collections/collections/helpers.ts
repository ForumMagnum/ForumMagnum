import { Utils } from '../../vulcan-lib';
import Collections from './collection';
import Books from '../books/collection';
import Sequences from '../sequences/collection';
import toDictionary from '../../utils/toDictionary';
import * as _ from 'underscore';

Collections.getAllPostIDs = async (collectionID: string): Promise<Array<string>> => {
  const books = await Books.find({collectionId: collectionID}).fetch();
  const sequenceIDs = _.flatten(books.map(book=>book.sequenceIds));
  
  const sequencePostsPairs = await Promise.all(
    sequenceIDs.map(async seqID => [seqID, await Sequences.getAllPostIDs(seqID)])
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

Collections.getPageUrl = (collection: CollectionsPageFragment|DbCollection, isAbsolute?: boolean): string => {
  const prefix = isAbsolute ? Utils.getSiteUrl().slice(0,-1) : '';
  return `${prefix}/${collection.slug}`;
}
