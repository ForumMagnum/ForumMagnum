import { addCallback, newMutation } from 'meteor/vulcan:core';
import Users from "meteor/vulcan:users";
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
    const response = await newMutation({
      collection: Users,
      document: userData,
      validate: false,
    })
    account = response.data
  }
  return account;
}

export async function NewAlignmentUserSendPMAsync (newUser, oldUser, context) {
  if (newUser.groups &&
      newUser.groups.includes('alignmentForum') &&
      (!oldUser.groups ||
       !(oldUser.groups.includes('alignmentForum')))) {

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
        `<div>
            <p>You've been approved for posting on http://alignment-forum.com.</p>
            <p>You can now:</p>
            <ul>
              <li> Create alignment posts</li>
              <li> Suggest other posts for the alignment forum</li>
              <li> Move comments to the alignment forum</li>
            </ul>
        </div>`

    const firstMessageData = {
      userId: lwAccount._id,
      contents: {
        originalContents: {
          type: "html",
          data: firstMessageContent
        }
      },
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
