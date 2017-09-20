/*

A SimpleSchema-compatible JSON schema

*/

import Users from 'meteor/vulcan:users';
import GraphQLSchema from 'meteor/vulcan:core';

const schema = {
  _id: {
    type: String,
    viewableBy: ['guests'],
    optional: true,
  },
  userId: {
    type: String,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    resolveAs: {
      fieldName: 'user',
      type: 'User',
      resolver: (report, args, context) => {
        return context.Users.findOne({_id: report.userId}, {fields: context.getViewableFields(context.currentUser, context.Users)});
      },
      addOriginalField: true,
    },
    optional: true,
  },
  commentId: {
    type: String,
    optional: false,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    resolveAs: {
      fieldName: 'comment',
      type: 'Comment',
      resolver: (report, args, context) => {
        return context.Comments.findOne({_id: report.commentId}, {fields: context.getViewableFields(context.currentUser, context.Comments)});
      },
      addOriginalField: true,
    },
  },
  postId: {
    type: String,
    optional: false,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    resolveAs: {
      fieldName: 'post',
      type: 'Post',
      resolver: (report, args, context) => {
        return context.Posts.findOne({_id: report.postId}, {fields: context.getViewableFields(context.currentUser, context.Posts)});
      },
      addOriginalField: true,
    },
  },
  link: {
    type: String,
    optional: false,
    insertableBy: ['members'],
    viewableBy: ['guests'],
  },
  claimedUserId: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['sunshineRegiment', 'admins'],
    insertableBy: ['sunshineRegiment', 'admins'],
    resolveAs: {
      fieldName: 'claimedUser',
      type: 'User',
      resolver: (report, args, context) => {
        return context.Users.findOne({_id: report.claimedUserId}, {fields: context.getViewableFields(context.currentUser, context.Users)});
      },
      addOriginalField: true,
    },
  },
  description: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
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
};

export default schema;
