/*

Comments schema

*/

import Users from 'meteor/vulcan:users';
import { generateIdResolverSingle } from '../../../lib/modules/utils/schemaUtils';
//import marked from 'marked';
//import { Utils } from 'meteor/vulcan:core';

/**
 * @summary Comments schema
 * @type {Object}
 */
const schema = {
  /**
    ID
  */
  _id: {
    type: String,
    optional: true,
    canRead: ['guests'],
  },
  /**
    The `_id` of the parent comment, if there is one
  */
  parentCommentId: {
    type: String,
    // regEx: SimpleSchema.RegEx.Id,
    max: 500,
    canRead: ['guests'],
    canCreate: ['members'],
    optional: true,
    resolveAs: {
      fieldName: 'parentComment',
      type: 'Comment',
      resolver: generateIdResolverSingle(
        {collectionName: 'Comments', fieldName: 'parentCommentId'}
      ),
      addOriginalField: true
    },
    hidden: true // never show this
  },
  /**
    The `_id` of the top-level parent comment, if there is one
  */
  topLevelCommentId: {
    type: String,
    // regEx: SimpleSchema.RegEx.Id,
    max: 500,
    canRead: ['guests'],
    canCreate: ['members'],
    optional: true,
    resolveAs: {
      fieldName: 'topLevelComment',
      type: 'Comment',
      resolver: generateIdResolverSingle(
        {collectionName: 'Comments', fieldName: 'topLevelCommentId'}
      ),
      addOriginalField: true
    },
    hidden: true // never show this
  },
  /**
    The timestamp of comment creation
  */
  createdAt: {
    type: Date,
    optional: true,
    canRead: ['admins'],
    onInsert: (document, currentUser) => {
      return new Date();
    }
  },
  /**
    The timestamp of the comment being posted. For now, comments are always created and posted at the same time
  */
  postedAt: {
    type: Date,
    optional: true,
    canRead: ['guests'],
    onInsert: (document, currentUser) => {
      return new Date();
    }
  },
  /**
    The comment body (Markdown)
  */
  body: {
    type: String,
    max: 3000,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    control: "textarea"
  },
  /**
    The HTML version of the comment body
  */
  htmlBody: {
    type: String,
    optional: true,
    canRead: ['guests'],
    // onInsert: (comment) => {
    //   if (comment.body) {
    //     return Utils.sanitize(marked(comment.body));
    //   }
    // },
    // onEdit: (modifier, comment) => {
    //   if (modifier.$set.body) {
    //     return Utils.sanitize(marked(modifier.$set.body));
    //   }
    // }
  },
  /**
    The comment author's name
  */
  author: {
    type: String,
    optional: true,
    canRead: ['guests'],
    onEdit: (modifier, document, currentUser) => {
      // if userId is changing, change the author name too
      if (modifier.$set && modifier.$set.userId) {
        return Users.getDisplayNameById(modifier.$set.userId)
      }
    }
  },
  /**
    The post's `_id`
  */
  postId: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    // regEx: SimpleSchema.RegEx.Id,
    max: 500,
    resolveAs: {
      fieldName: 'post',
      type: 'Post',
      resolver: generateIdResolverSingle(
        {collectionName: 'Posts', fieldName: 'postId'}
      ),
      addOriginalField: true
    },
    hidden: true // never show this
  },
  /**
    The comment author's `_id`
  */
  userId: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
    resolveAs: {
      fieldName: 'user',
      type: 'User',
      resolver: generateIdResolverSingle(
        {collectionName: 'Users', fieldName: 'userId'}
      ),
      addOriginalField: true
    },
  },
  /**
    Whether the comment is deleted. Delete comments' content doesn't appear on the site.
  */
  isDeleted: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
  },
  userIP: {
    type: String,
    optional: true,
    canRead: ['admins'],
  },
  userAgent: {
    type: String,
    optional: true,
    canRead: ['admins'],
  },
  referrer: {
    type: String,
    optional: true,
    canRead: ['admins'],
  },

  // GraphQL only fields

  pageUrl: {
    type: String,
    optional: true,
    canRead: ['guests'],
    resolveAs: {
      fieldName: 'pageUrl',
      type: 'String',
      resolver: (comment, args, context) => {
        return context.Comments.getPageUrl(comment, true)
      },
    }
  },
};

export default schema;
