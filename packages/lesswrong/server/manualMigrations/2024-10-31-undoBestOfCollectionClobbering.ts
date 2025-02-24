import { registerMigration } from './migrationUtils';
import Posts from '../../lib/collections/posts/collection';
import Collections from '../../lib/collections/collections/collection';
import Sequences from '../../lib/collections/sequences/collection';
import Chapters from '../../lib/collections/chapters/collection';
import * as _ from 'underscore';

// Extracted from this spreadsheet: https://docs.google.com/spreadsheets/d/1E9BgDtrYho9YU_vsnM9DMIWUa4zUH8M72MCA9wIl_vw/
const POSTS_TO_UPDATE = [
  { postId: '2cYebKxNp47PapHTL', sequenceId: 'weBHYgBXg9thEQNEe' },
  { postId: '4s2gbwMHSdh2SByyZ', sequenceId: 'xEFeCwk3pdYdeG2rL' },
  { postId: '5FZxhdi6hZp8QwK7k', sequenceId: 'yYxggfHYRrqnJXuRx' },
  { postId: '6DuJxY8X45Sco4bS2', sequenceId: 'fSMbebQyR4wheRrvk' },
  { postId: '6Xgy6CAf2jqHhynHL', sequenceId: '5Eg2urmQjA4ZNcezy' },
  { postId: '8xRSjC76HasLnMGSf', sequenceId: 'mzgtmmTKKn5MuCzFJ' },
  { postId: 'A8iGaZ3uHNNGgJeaD', sequenceId: 'HmANELvkhAZ9eDxFS' },
  { postId: 'aFaKhG86tTrKvtAnT', sequenceId: '5Eg2urmQjA4ZNcezy' },
  { postId: 'AHhCrJ2KpTjsCSwbt', sequenceId: 'BRrcuwiF2SYWTQfqA' },
  { postId: 'Ajcq9xWi2fmgn8RBJ', sequenceId: 'HeYtBkNbEe7wpjc6X' },
  { postId: 'B2CfMNfay2P8f2yyc', sequenceId: 'wnQWakxdRodnKm5kH' },
  { postId: 'D6trAzh6DApKPhbv4', sequenceId: 'ZBNBTSMAXbyJwJoKY' },
  { postId: 'F5ktR95qqpmGXXmLq', sequenceId: 'yYxggfHYRrqnJXuRx' },
  { postId: 'FkgsxrGf3QxhfLWHG', sequenceId: 'r9tYkB2a8Fp4DN8yB' },
  { postId: 'gvK5QWRLk3H8iqcNy', sequenceId: 'xEFeCwk3pdYdeG2rL' },
  { postId: 'ham9i5wf4JCexXnkN', sequenceId: 'kNANcHLNtJt5qeuSS' },
  { postId: 'hyShz2ABiKX56j5tJ', sequenceId: 'xEFeCwk3pdYdeG2rL' },
  { postId: 'i42Dfoh4HtsCAfXxL', sequenceId: 'pC6DYFLPMTCbEwH8W' },
  { postId: 'i9xyZBS3qzA8nFXNQ', sequenceId: 'ZbmRyDN8TCpBTZSip' },
  { postId: 'ivpKSjM4D6FbqF4pZ', sequenceId: 'dZMDxPBZgHzorNDTt' },
  { postId: 'JPan54R525D68NoEt', sequenceId: '5Eg2urmQjA4ZNcezy' },
  { postId: 'N5Jm6Nj4HkNKySA5Z', sequenceId: 'kxs3eeEti9ouwWFzr' },
  { postId: 'NQgWL7tvAPgN2LTLn', sequenceId: '6eWnDWYn5Nudg2k7L' },
  { postId: 'NxF5G6CJiof6cemTw', sequenceId: '4dHMdK5TLN6xcqtyc' },
  { postId: 'P6fSj3t4oApQQTB7E', sequenceId: 'xEFeCwk3pdYdeG2rL' },
  { postId: 'p7x32SEt43ZMC9r7r', sequenceId: 'Rm6oQRJJmhGCcLvxh' },
  { postId: 'rz73eva3jv267Hy7B', sequenceId: 'akMLzwcRdJNnmBoLa' },
  { postId: 'rzqACeBGycZtqCfaX', sequenceId: '5Eg2urmQjA4ZNcezy' },
  { postId: 'SwcyMEgLyd4C3Dern', sequenceId: 'HeYtBkNbEe7wpjc6X' },
  { postId: 'wEebEiPpEwjYvnyqq', sequenceId: 'xEFeCwk3pdYdeG2rL' },
  { postId: 'wQACBmK5bioNCgDoG', sequenceId: 'pC6DYFLPMTCbEwH8W' },
  { postId: 'xCxeBSHqMEaP3jDvY', sequenceId: '7CdoznhJaLEKHwvJW' },
  { postId: 'xJyY5QkQvNJpZLJRo', sequenceId: 'HmANELvkhAZ9eDxFS' },
  { postId: 'YABJKJ3v97k9sbxwg', sequenceId: 'xEFeCwk3pdYdeG2rL' },
  { postId: 'yeADMcScw8EW9yxpH', sequenceId: 'zucjLBpQ9S9eWPWGu' },
  { postId: 'YN6daWakNnkXEeznB', sequenceId: 'hBFDRZCPLcrRDubgm' },
  { postId: 'zB4f7QqKhBHa5b37a', sequenceId: 'CmrW8fCmSLK7E25sa' },
  { postId: 'ZDZmopKquzHYPRNxq', sequenceId: 'NkCAHsDPchBHabEuc' },
  { postId: 'zp5AEENssb8ZDnoZR', sequenceId: 'yiFxBWDXnLpbWGTkK' },
  { postId: 'zTfSXQracE7TW8x4w', sequenceId: 'uLEjM2ij5y3CXXW6c' },
  { postId: '5gfqG3Xcopscta3st', sequenceId: 'ZbmRyDN8TCpBTZSip' },
  { postId: 'rYJKvagRYeDM8E9Rf', sequenceId: 'pC6DYFLPMTCbEwH8W' },
  { postId: '7im8at9PmhbT4JHsW', sequenceId: 'n945eovrA3oDueqtq' },
  { postId: 'ax695frGJEzGxFBK4', sequenceId: 'n945eovrA3oDueqtq' },
  { postId: 'nNqXfnjiezYukiMJi', sequenceId: 'n945eovrA3oDueqtq' },
  { postId: 'RQpNHSiWaXTvDxt6R', sequenceId: 'FYMiCeXEgMzsB5stm' },
];

export default registerMigration({
  name: 'undoBestOfCollectionClobbering',
  dateWritten: '2024-10-31',
  idempotent: true,
  action: async () => {
    const collectionId = 'nmk3nLpQE89dMRzzN'; 

    // Step 1: Remove canonical fields from affected posts
    const collectionDoc = await Collections.findOne({ _id: collectionId });
    if (!collectionDoc) {
      // eslint-disable-next-line no-console
      console.error(`Collection with ID ${collectionId} not found.`);
      return;
    }
    const collectionSlug = collectionDoc.slug;

    const postsToUnset = await Posts.find({ canonicalCollectionSlug: collectionSlug }).fetch();
    // eslint-disable-next-line no-console
    console.log(`Found ${postsToUnset.length} posts to unset canonical fields.`);

    if (postsToUnset.length > 0) {
      const updates = postsToUnset.map(post => ({
        updateOne: {
          filter: { _id: post._id },
          update: {
            $unset: {
              canonicalPrevPostSlug: "",
              canonicalNextPostSlug: "",
              canonicalBookId: "",
              canonicalCollectionSlug: "",
              canonicalSequenceId: "",
            }
          }
        }
      }));
      await Posts.rawCollection().bulkWrite(updates, { ordered: false });
      // eslint-disable-next-line no-console
      console.log(`Unset canonical fields for ${updates.length} posts.`);
    }

    // Step 2: Update canonical fields for specified posts
    const postsBySequenceId = _.groupBy(POSTS_TO_UPDATE, 'sequenceId');
    for (const sequenceId in postsBySequenceId) {
      const postsList = postsBySequenceId[sequenceId];
      const postIdsToUpdate = postsList.map(item => item.postId);

      const sequence = await Sequences.findOne({ _id: sequenceId });
      if (!sequence) {
        // eslint-disable-next-line no-console
        console.error(`Sequence with ID ${sequenceId} not found.`);
        continue;
      }

      const postsInSequence = await getPostsInSequence(sequenceId);
      const postsToUpdateInOrder = postsInSequence.filter(post => postIdsToUpdate.includes(post._id));

      const updates = [];
      for (let i = 0; i < postsToUpdateInOrder.length; i++) {
        const currentPost = postsToUpdateInOrder[i];
        const prevPost = i > 0 ? postsToUpdateInOrder[i - 1] : null;
        const nextPost = i < postsToUpdateInOrder.length - 1 ? postsToUpdateInOrder[i + 1] : null;

        updates.push({
          updateOne: {
            filter: { _id: currentPost._id },
            update: {
              $set: {
                canonicalPrevPostSlug: prevPost ? prevPost.slug : '',
                canonicalNextPostSlug: nextPost ? nextPost.slug : '',
                canonicalSequenceId: sequenceId,
              }
            }
          }
        });
      }

      if (updates.length > 0) {
        await Posts.rawCollection().bulkWrite(updates, { ordered: false });
        // eslint-disable-next-line no-console
        console.log(`Updated canonical fields for ${updates.length} posts in sequence ${sequenceId}.`);
      }
    }
  }
});

async function getPostsInSequence(sequenceId: string): Promise<DbPost[]> {
  const chapters = await Chapters.find({ sequenceId }, { sort: { number: 1 } }).fetch();
  const postIds: string[] = [];
  for (const chapter of chapters) {
    if (chapter.postIds && chapter.postIds.length > 0) {
      postIds.push(...chapter.postIds);
    }
  }
  const posts = await Posts.find({ _id: { $in: postIds } }, { projection: { _id: 1, slug: 1 } }).fetch();
  const postsById = _.indexBy(posts, '_id');
  const postsInOrder = postIds.map(postId => postsById[postId]).filter(post => !!post);
  return postsInOrder;
}
