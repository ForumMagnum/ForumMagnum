import { addCallback, newMutation, editMutation } from '../../vulcan-lib';
import Users from "../../../lib/collections/users/collection";
import Messages from '../../../lib/collections/messages/collection';
import Conversations from '../../../lib/collections/conversations/collection';
import { Posts } from '../../../lib/collections/posts/collection';

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

function isAlignmentForumMember(user) {
  return user?.groups?.includes('alignmentForum')
}

export async function NewAlignmentUserSendPMAsync (newUser, oldUser, context) {
  if (isAlignmentForumMember(newUser) && !isAlignmentForumMember(oldUser)) {
    const lwAccount = await getAlignmentForumAccount();
    if (!lwAccount) throw Error("Unable to find the lwAccount to send the new alignment user message")
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
            <p>You've been approved for posting on https://alignment-forum.com.</p>
            <p>You can now:</p>
            <ul>
              <li> Create alignment posts</li>
              <li> Suggest other posts for the Alignment Forum</li>
              <li> Move comments to the AI Alignment Forum</li>
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

async function NewAlignmentUserMoveShortform(newUser, oldUser, context) {
  if (isAlignmentForumMember(newUser) && !isAlignmentForumMember(oldUser)) {
    if (newUser.shortformFeedId) {
      editMutation({
        collection:Posts,
        documentId: newUser.shortformFeedId,
        set: {
          af: true
        },
        unset: {},
        validate: false,
      })
    }
  }
}

addCallback("users.edit.async", NewAlignmentUserMoveShortform);
