import { Votes } from 'meteor/vulcan:voting';
import { getCollection } from 'meteor/vulcan:core';

Votes.addField([
  /**
    URL (Overwriting original schema)
  */
  {
    fieldName: "documentId",
    fieldSchema: {
      resolveAs: {
        fieldName: 'documentUserSlug',
        type: 'String',
        resolver: (vote, args, context) => {
          const document = getCollection(vote.collectionName).findOne(vote.documentId, {fields:{userId:true}})
          const documentUserId = document.userId
          if (documentUserId) {
            const documentUser = context.Users.findOne({_id:documentUserId}, {fields:{slug:true, displayName:true}})
            return documentUser.slug
          }

          // return documentUser
          // return documentUserId
          // context.RSSFeeds.findOne({_id: post.feedId}, {fields: context.getViewableFields(context.currentUser, context.RSSFeeds)})
        },
        addOriginalField: true,
      },
    }
  }
])
