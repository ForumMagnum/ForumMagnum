import Collections from './collection.js';
import Books from '../books/collection.js';
import Sequences from '../sequences/collection.js';
import toDictionary from '../../modules/utils/toDictionary.js';

Collections.getAllPostIDs = async (collectionID) => {
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

Collections.getPageUrl = (collection, isAbsolute) => {
  const prefix = isAbsolute ? Utils.getSiteUrl().slice(0,-1) : '';
  return `${prefix}/${collection.slug}`;
}