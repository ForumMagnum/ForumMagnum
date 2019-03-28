/* global Vulcan */
import { forEachBucketRangeInCollection } from '../queryUtil.js';
import { Comments } from '../../lib/collections/comments/collection.js'
import { Posts } from '../../lib/collections/posts/collection.js'
import { dataToMarkdown } from '../editor/make_editable_callbacks.js';
import keyBy from 'lodash/keyBy';
import fs from 'fs';

const scoreThreshold = 5;

function getCommentMarkdown(comment) {
  const originalContents = comment.contents.originalContents;
  const result = dataToMarkdown(originalContents.data, originalContents.type);
  return result;
}
function getPostMarkdown(post) {
  const originalContents = post.contents.originalContents;
  const result = dataToMarkdown(originalContents.data, originalContents.type);
  return result;
}

const exportPostReplyPairs = async (filename) => {
  //eslint-disable-next-line no-console
  console.log(`Exporting post/comment-reply pairs to ${filename}`);
  const outputFile = fs.openSync(filename, 'w');
  fs.writeSync(outputFile, '[\n');
  
  // Get comments scored >=scoreThreshold which reply to posts/comments scored >=scoreThreshold.
  await forEachBucketRangeInCollection({
    collection: Comments,
    filter: {
      baseScore: {$gt: scoreThreshold},
      deleted: false,
    },
    bucketSize: 1000,
    fn: async (commentBatchFilter) => {
      const commentsInBatch = await Comments.find(commentBatchFilter).fetch();
      //eslint-disable-next-line no-console
      console.log(`${commentsInBatch.length} comments in batch`);
      
      const parentCommentIds = _.filter(_.map(commentsInBatch, comment=>comment && comment.parentCommentId), id=>id);
      const parentCommentsList = await Comments.find({_id: {$in: parentCommentIds}}).fetch();
      const parentCommentsDict = keyBy(parentCommentsList, comment=>comment._id);
      
      const parentPostIds = _.filter(_.map(commentsInBatch, comment=>comment && comment.postId), id=>id);
      const parentPostsList = await Posts.find({_id: {$in: parentPostIds}}).fetch();
      const parentPostsDict = keyBy(parentPostsList, post=>post._id);
      
      for (let comment of commentsInBatch) {
        try {
          if (comment.parentCommentId) {
            const parentComment = parentCommentsDict[comment.parentCommentId];
            if (parentComment
              && parentComment.baseScore >= scoreThreshold
              && comment.contents && comment.contents.originalContents
              && parentComment.contents && parentComment.contents.originalContents
              )
            {
              fs.writeSync(outputFile, JSON.stringify({
                comment: getCommentMarkdown(comment),
                parent: getCommentMarkdown(parentComment),
              }));
              fs.writeSync(outputFile, ',\n');
            }
          } else if (comment.postId) {
            const parentPost = parentPostsDict[comment.postId];
            if (parentPost
              && parentPost.baseScore >= scoreThreshold
              && !parentPost.draft
              && parentPost.status===Posts.config.STATUS_APPROVED
              && comment.contents && comment.contents.originalContents
              && parentPost.contents && parentPost.contents.originalContents
              )
            {
              fs.writeSync(outputFile, JSON.stringify({
                comment: getCommentMarkdown(comment),
                parent: getPostMarkdown(parentPost),
              }));
              fs.writeSync(outputFile, ',\n');
            }
          }
        } catch(e) {
          //eslint-disable-next-line no-console
          console.log("Skipping a comment");
        }
      }
    }
  });
  
  fs.writeSync(outputFile, ']\n');
  fs.closeSync(outputFile);
  //eslint-disable-next-line no-console
  console.log(`Done exporting`);
}
Vulcan.exportPostReplyPairs = exportPostReplyPairs;