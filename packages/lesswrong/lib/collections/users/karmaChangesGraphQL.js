import Users from "meteor/vulcan:users";
import { getKarmaChanges, getKarmaChangeDateRange, getKarmaChangeNextBatchDate } from "../../karmaChanges.js";
import { addGraphQLSchema, addGraphQLResolvers, getSetting } from 'meteor/vulcan:core';

addGraphQLSchema(`
  type PostKarmaChange {
    _id: String
    scoreChange: Int
    title: String
    slug: String
  }
`);

addGraphQLSchema(`
  type CommentKarmaChange {
    _id: String
    scoreChange: Int
    description: String
    postId: String
  }
`);

addGraphQLSchema(`
  type KarmaChanges {
    totalChange: Int
    startDate: Date
    endDate: Date
    nextBatchDate: Date
    updateFrequency: String
    posts: [PostKarmaChange]
    comments: [CommentKarmaChange]
  }
`);

addGraphQLResolvers({
  KarmaChanges: {
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