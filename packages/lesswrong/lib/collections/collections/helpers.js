import Collections from './collection.js';
import Books from '../books/collection.js';
import Sequences from '../sequences/collection.js';

Collections.getAllPostIDs = async (collectionID) => {
  const books = await Books.find({collectionId: collectionID}).fetch();
  const sequenceIDs = _.flatten(_.map(books, book=>book.sequenceIds));
  
  const postsBySequence = await Promise.all(
    _.map(sequenceIDs, seqID=>Sequences.getAllPostIDs(seqID))
  );
  const posts = _.flatten(postsBySequence);
  return posts;
};

Collections.getPageUrl = (collection, isAbsolute) => {
  const prefix = isAbsolute ? Utils.getSiteUrl().slice(0,-1) : '';
  return `${prefix}/${collection.slug}`;
}