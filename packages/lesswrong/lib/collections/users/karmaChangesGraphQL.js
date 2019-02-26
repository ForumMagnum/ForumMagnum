import Users from "meteor/vulcan:users";
import { getKarmaChanges, getKarmaChangeDateRange, getKarmaChangeNextBatchDate } from "../../karmaChanges.js";
import { addGraphQLSchema, addGraphQLResolvers, Connectors, getSetting } from 'meteor/vulcan:core';
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
    nextBatchDate: Date
    updateFrequency: String
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
    updateFrequency: async (karmaChangesJSON, args, {currentUser}) => {
      if (!currentUser) return null;
      const settings = currentUser.karmaChangeNotifierSettings
      return settings.updateFrequency;
    },
  }
})

Users.addField([
  {
    fieldName: 'karmaChanges',
    fieldSchema: {
      viewableBy: Users.owns,
      type: 'KarmaChanges',
      optional: true,
      resolveAs: {
        arguments: 'startDate: Date, endDate: Date',
        type: 'KarmaChanges',
        resolver: async (document, {startDate,endDate}, {currentUser}) => {
          if (!currentUser)
            return null;
          
          // Grab new current user, because the current user gets set at the beginning of the request, which
          // is out of date in this case, because we are depending on recent mutations being reflected on the current user
          const newCurrentUser = await Users.findOne(currentUser._id)
          
          const settings = newCurrentUser.karmaChangeNotifierSettings
          const now = new Date();
          
          // If date range isn't specified, infer it from user settings
          if (!startDate || !endDate) {
            // If the user has karmaChanges disabled, don't return anything
            if (settings.updateFrequency === "disabled") return null
            const lastOpened = newCurrentUser.karmaChangeLastOpened;
            const lastBatchStart = newCurrentUser.karmaChangeBatchStart;
            
            const {start, end} = getKarmaChangeDateRange({settings, lastOpened, lastBatchStart, now}) 
            startDate = start;
            endDate = end;
          }
          
          const nextBatchDate = getKarmaChangeNextBatchDate({settings, now});
          
          const alignmentForum = getSetting('AlignmentForum', false);
          return getKarmaChanges({
            user: document,
            startDate, endDate,
            nextBatchDate,
            af: alignmentForum,
          });
        },
      },
    },
  },
]);