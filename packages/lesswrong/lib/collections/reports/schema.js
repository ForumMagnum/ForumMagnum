import { generateIdResolverSingle } from '../../modules/utils/schemaUtils'
/*

A SimpleSchema-compatible JSON schema

*/

const schema = {
  _id: {
    type: String,
    viewableBy: ['guests'],
    optional: true,
  },
  userId: {
    type: String,
    foreignKey: "Users",
    viewableBy: ['guests'],
    insertableBy: ['members'],
    hidden: true,
    resolveAs: {
      fieldName: 'user',
      type: 'User',
      resolver: generateIdResolverSingle(
        {collectionName: 'Users', fieldName: 'userId'}
      ),
      addOriginalField: true,
    },
    optional: true,
  },
  commentId: {
    type: String,
    foreignKey: "Comments",
    optional: true,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    hidden: true,
    resolveAs: {
      fieldName: 'comment',
      type: 'Comment',
      resolver: generateIdResolverSingle(
        {collectionName: 'Comments', fieldName: 'commentId'}
      ),
      addOriginalField: true,
    },
  },
  postId: {
    type: String,
    foreignKey: "Posts",
    optional: false,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    hidden: true,
    resolveAs: {
      fieldName: 'post',
      type: 'Post',
      resolver: generateIdResolverSingle(
        {collectionName: 'Posts', fieldName: 'postId'}
      ),
      addOriginalField: true,
    },
  },
  link: {
    type: String,
    optional: false,
    insertableBy: ['members'],
    viewableBy: ['guests'],
    searchable: true,
    hidden: true,
  },
  claimedUserId: {
    type: String,
    foreignKey: "Users",
    optional: true,
    viewableBy: ['guests'],
    hidden: true,
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    resolveAs: {
      fieldName: 'claimedUser',
      type: 'User',
      resolver: generateIdResolverSingle(
        {collectionName: 'Users', fieldName: 'claimedUserId'}
      ),
      addOriginalField: true,
    },
  },
  description: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    label: "Reason",
    placeholder: "What are you reporting this comment for?",
    searchable: true,
  },
  createdAt: {
    optional: true,
    type: Date,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    onInsert: (document, currentUser) => {
      return new Date();
    },
  },
  closedAt: {
    optional: true,
    type: Date,
    viewableBy: ['guests'],
    editableBy: ['admins'],
  },
  // Only set when report is closed. Indicates whether content is spam or not.
  markedAsSpam: {
    optional: true, 
    type: Boolean, 
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
  },
  // Set when report is created, indicates whether content was reported as spam
  // (currently only used for Akismet integration)
  reportedAsSpam: {
    optional: true,
    type: Boolean,
    viewableBy: ['guests'], 
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['members']
  }
};

export default schema;
