import { addCallback, newMutation, getSetting } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { Comments, commentMutationOptions } from '../lib/collections/comments/collection.js'
import { dataToMarkdown } from './editor/make_editable_callbacks.js';
import request from 'request';

export function getCommentText(comment) {
  const originalContents = comment.contents.originalContents;
  const result = dataToMarkdown(originalContents.data, originalContents.type);
  return result;
}
export function getPostText(post) {
  const originalContents = post.contents.originalContents;
  const result = dataToMarkdown(originalContents.data, originalContents.type);
  return result;
}

const gpt2serverURL = "http://ec2-52-55-65-83.compute-1.amazonaws.com:8000";

const generateReply = async (prompt) => {
  // Make an HTTP POST request to get reply text
  return new Promise((resolve, reject) => {
    request.post(
      {
        url: gpt2serverURL,
        form: prompt
      }, function(err, httpResponse, body) {
        if (err) reject(err);
        return resolve(body);
      }
    );
  });
}

const ReplyToCommentWithGpt2 = async (parentComment) => {
  try {
    if (!getSetting("aprilFools", false))
      return;
    
    // Find the GPT2 account
    const gpt2user = await Users.findOne({displayName: "GPT2"});
    
    if (!gpt2user) return;
    
    if (gpt2user.banned) return;
    
    // GPT-2 doesn't reply to itself
    if (parentComment.userId === gpt2user._id)
      return;
    
    // Get the comment text
    const parentCommentText = getCommentText(parentComment);
    const replyBody = await generateReply(parentCommentText);
    
    const document = {
      userId: gpt2user._id,
      contents: {
        originalContents: {
          type: "markdown",
          data: replyBody,
        }
      },
      parentCommentId: parentComment._id,
      postId: parentComment.postId,
      parentAnswerId: parentComment.parentAnswerId,
    }
    
    
    // Create the reply
    if (commentMutationOptions.newCheck(gpt2user, document)) {
      await newMutation({
        collection: Comments,
        document: document,
        context: {
          currentUser: gpt2user,
          Users: Users,
        },
        currentUser: gpt2user,
        validate: true,
      });
    }
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

addCallback('comments.new.async', ReplyToCommentWithGpt2);