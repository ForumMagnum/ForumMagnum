/*

Comments schema

*/

import Users from 'meteor/vulcan:users';
import { generateIdResolverSingle } from '../../../lib/modules/utils/schemaUtils';
import { Posts } from '../posts/collection'
//import marked from 'marked';
//import { Utils } from 'meteor/vulcan:core';
import { schemaDefaultValue } from '../../collectionUtils';

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
    foreignKey: "Comments",
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
    foreignKey: "Comments",
    denormalized: true,
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
    The comment author's name
  */
  author: {
    type: String,
    optional: true,
    canRead: ['guests'],
    onInsert: (document, currentUser) => {
      // if userId is changing, change the author name too
      if (document.userId) {
        return Users.getDisplayNameById(document.userId)
      }
    },
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
    foreignKey: "Posts",
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
    foreignKey: "Users",
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
    FIXME: Not a real field. We inherited this from vulcan-starter, but
    implemented our own, unrelated soft delete mechanism with the field named
    `deleted` rather than `isDeleted`.
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
      type: 'String',
      resolver: (comment, args, context) => {
        return context.Comments.getPageUrl(comment, true)
      },
    }
  },

  pageUrlRelative: {
    type: String,
    optional: true,
    canRead: ['guests'],
    resolveAs: {
      type: 'String',
      resolver: (comment, args, context) => {
        return context.Comments.getPageUrl(comment, false)
      },
    }
  },

  answer: {
    type: Boolean,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    ...schemaDefaultValue(false),
  },

  parentAnswerId: {
    type: String,
    denormalized: true,
    foreignKey: "Comments",
    canRead: ['guests'],
    canCreate: ['members'],
    optional: true,
    hidden: true,
    resolveAs: {
      fieldName: 'parentAnswer',
      type: 'Comment',
      resolver: generateIdResolverSingle(
        {collectionName: 'Comments', fieldName: 'parentAnswerId'}
      ),
      addOriginalField: true
    },
  },

  chosenAnswer: {
    type: Boolean,
    optional: true,
    hidden: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [Users.owns, 'sunshineRegiment', 'admins'],
    ...schemaDefaultValue(false),
  },

  // The semver-style version of the post that this comment was made against
  // This gets automatically created in a callback on creation
  postVersion: {
    type: String, 
    optional: true,
    canRead: ['guests'],
    onCreate: async ({newDocument}) => {
      const post = await Posts.findOne({_id: newDocument.postId})
      return (post && post.contents && post.contents.version) || "1.0.0"
    }
  },
  
  // DEPRECATED fields for GreaterWrong backwards compatibility
  wordCount: {
    type: Number,
    viewableBy: ['guests'],
    optional: true,
    resolveAs: {
      type: 'Int',
      resolver: (comment, args, { Comments }) => {
        const contents = comment.contents;
        return contents.wordCount;
      }
    }
  },
  htmlBody: {
    type: String,
    viewableBy: ['guests'],
    optional: true,
    resolveAs: {
      type: 'String',
      resolver: (comment, args, { Comments }) => {
        const contents = comment.contents;
        return contents.html;
      }
    }
  },
};

export default schema;
