import React from 'react';
import { addCallback, newMutation } from 'meteor/vulcan:core';
import Users from "meteor/vulcan:users";
import { ContentState, convertToRaw } from 'draft-js';
import Messages from '../../../collections/messages/collection.js';
import Conversations from '../../../collections/conversations/collection.js';

const getAlignmentForumAccount = async () => {
  let account = Users.findOne({username: "AI Alignment Forum"});
  if (!account) {
    const userData = {
      username: "AI Alignment Forum",
      displayName: "AI Alignment Forum",
      email: "aialignmentforum@lesswrong.com",
    }
    account = await newMutation({
      collection: Users,
      document: userData,
      validate: false,
    })
    return account.data
  }
  return account;
}

export async function NewAlignmentUserSendPMAsync (newUser, oldUser, context) {
  if (newUser.groups.includes('alignmentForum') && !(oldUser.groups.includes('alignmentForum'))) {

    const lwAccount = await getAlignmentForumAccount();
    const conversationData = {
      participantIds: [newUser._id, lwAccount._id],
      title: `Welcome to the AI Alignment Forum!`
    }
    const conversation = await newMutation({
      collection: Conversations,
      document: conversationData,
      currentUser: lwAccount,
      validate: false,
      context
    });

    let firstMessageContent =
        `You've been approved for posting on http://alignment-forum.com. You can now:
        – create alignment posts
        – suggest other posts for the alignment forum
        – move comments to the alignment forum`

    const firstMessageData = {
      userId: lwAccount._id,
      content: convertToRaw(ContentState.createFromText(firstMessageContent)),
      conversationId: conversation.data._id
    }

    newMutation({
      collection: Messages,
      document: firstMessageData,
      currentUser: lwAccount,
      validate: false,
      context
    })
  }
}

addCallback("users.edit.async", NewAlignmentUserSendPMAsync);
