import Users from "meteor/vulcan:users";
import { getKarmaChanges } from "../../karmaChanges.js";
import { addGraphQLSchema, addGraphQLResolvers, Connectors } from 'meteor/vulcan:core';
import { Comments } from '../comments'
import { Posts } from '../posts'

addGraphQLSchema(`
  type PostWithScoreChange {
    scoreChange: Int
    post: Post
  }
`);
addGraphQLSchema(`
  type CommentWithScoreChange {
    scoreChange: Int
    comment: Comment
  }
`);
addGraphQLSchema(`
  type KarmaChanges {
    totalChange: Int
    startDate: Date
    endDate: Date
    posts: [PostWithScoreChange]
    comments: [CommentWithScoreChange]
  }
`);

addGraphQLResolvers({
  KarmaChanges: {
    posts: async (karmaChangesJSON, args, context) => {
      let posts = _.filter(karmaChangesJSON.documents, d=>d.collectionName==="Posts");
      let postPromises = _.map(posts, post => Connectors.get(Posts, post._id));
      let postObjects = await Promise.all(postPromises);
      let postsById = {};
      _.each(postObjects, post => postsById[post._id] = post);
      
      return _.map(posts, post => ({
        scoreChange: post.scoreChange,
        post: postsById[post._id],
      }));
    },
    comments: async (karmaChangesJSON, args, context) => {
      let comments = _.filter(karmaChangesJSON.documents, d=>d.collectionName==="Comments");
      let commentPromises = _.map(comments, comment => Connectors.get(Comments, comment._id));
      let commentObjects = await Promise.all(commentPromises);
      let commentsById = {};
      _.each(commentObjects, comment => commentsById[comment._id] = comment);
      
      return _.map(comments, comment => ({
        scoreChange: comment.scoreChange,
        comment: commentsById[comment._id],
      }));
    },
  }
})

Users.addField([
  {
    fieldName: 'karmaChanges',
    fieldSchema: {
      viewableBy: Users.owns,
      type: 'KarmaChanges',
      resolveAs: {
        arguments: 'startDate: Date, endDate: Date',
        type: 'KarmaChanges',
        resolver: async (document, args, context) => {
          let {startDate,endDate} = args;
          
          // If date range isn't specified, infer it from user settings
          if (!startDate || !endDate) {
            // TODO
            const yesterday = new Date(new Date() - (60*60*24*1000));
            startDate = yesterday;
            endDate = new Date();
          }
          
          return getKarmaChanges({
            user: document,
            startDate, endDate
          });
        },
      },
    },
  },
]);