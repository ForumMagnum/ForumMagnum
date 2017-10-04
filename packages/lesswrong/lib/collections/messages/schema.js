/*

A SimpleSchema-compatible JSON schema

*/

import Users from 'meteor/vulcan:users';
import { getDynamicComponent } from 'meteor/vulcan:core';
import ReactDOMServer from 'react-dom/server';
import React from 'react';

const schema = {
  _id: {
    type: String,
    viewableBy: Users.owns,
    optional: true,
  },
  userId: {
    type: String,
    viewableBy: ['members'],
    insertableBy: Users.owns,
    resolveAs: {
      fieldName: 'user',
      type: 'User',
      resolver: (message, args, context) => {
        return context.Users.findOne({_id: message.userId}, {fields: context.getViewableFields(context.currentUser, context.Users)});
      },
      addOriginalField: true,
    },
    optional: true,
  },
  createdAt: {
    optional: true,
    type: Date,
    viewableBy: ['members'],
    onInsert: (document, currentUser) => {
      return new Date();
    },
  },
  content: {
    type: Object,
    viewableBy: ['members'],
    insertableBy: ['members'],
    editableBy: Users.owns,
    control: (props) => getDynamicComponent(import('../../../components/async/EditorFormComponent.jsx'), props),
    order: 2,
    blackbox: true,
    optional: true,
  },

  htmlBody: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    control: "textarea",
    hidden: true,
  },

  conversationId: {
    type: String,
    viewableBy: ['members'],
    insertableBy: ['members'],
    hidden: true,
    resolveAs: {
      fieldName: 'conversation',
      type: 'Conversation',
      resolver: (message, args, context) => {
        return context.Conversations.findOne({ _id: message.conversationId }, { fields: context.getViewableFields(context.currentUser, context.Conversations) })},
      addOriginalField: true,
    },
  }
};

export default schema;
