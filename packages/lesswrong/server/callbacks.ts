import Notifications from '../lib/collections/notifications/collection';
import Conversations from '../lib/collections/conversations/collection';
import Reports from '../lib/collections/reports/collection';

import { Bans } from '../lib/collections/bans/collection';
import Users from '../lib/collections/users/collection';
import { Votes } from '../lib/collections/votes';
import { cancelVoteServer } from './voteServer';
import { Posts } from '../lib/collections/posts';
import { Comments } from '../lib/collections/comments'
import { ReadStatuses } from '../lib/collections/readStatus/collection';

import { getCollection, addCallback, newMutation, editMutation, removeMutation, Utils, runCallbacksAsync, runQuery } from './vulcan-lib';
import { asyncForeachSequential } from '../lib/utils/asyncUtils';


async function updateConversationActivity (message: DbMessage) {
  // Update latest Activity timestamp on conversation when new message is added
  const user = Users.findOne(message.userId);
  const conversation = Conversations.findOne(message.conversationId);
  if (!conversation) throw Error(`Can't find conversation for message ${message}`)
  await editMutation({
    collection: Conversations,
    documentId: conversation._id,
    set: {latestActivity: message.createdAt},
    currentUser: user,
    validate: false,
  });
}
addCallback("messages.new.async", updateConversationActivity);

function userEditVoteBannedCallbacksAsync(user: DbUser, oldUser: DbUser) {
  if (user.voteBanned && !oldUser.voteBanned) {
    runCallbacksAsync('users.voteBanned.async', user);
  }
  return user;
}
addCallback("users.edit.async", userEditVoteBannedCallbacksAsync);

async function userEditNullifyVotesCallbacksAsync(user: DbUser, oldUser: DbUser) {
  if (user.nullifyVotes && !oldUser.nullifyVotes) {
    runCallbacksAsync('users.nullifyVotes.async', user);
  }
  return user;
}
addCallback("users.edit.async", userEditNullifyVotesCallbacksAsync);


function userEditDeleteContentCallbacksAsync(user: DbUser, oldUser: DbUser) {
  if (user.deleteContent && !oldUser.deleteContent) {
    runCallbacksAsync('users.deleteContent.async', user);
  }
  return user;
}
addCallback("users.edit.async", userEditDeleteContentCallbacksAsync);

function userEditBannedCallbacksAsync(user: DbUser, oldUser: DbUser) {
  if (new Date(user.banned) > new Date() && !(new Date(oldUser.banned) > new Date())) {
    runCallbacksAsync('users.ban.async', user);
  }
  return user;
}
addCallback("users.edit.async", userEditBannedCallbacksAsync);

// document, voteType, collection, user, updateDocument

const reverseVote = async (vote: DbVote) => {
  const collection = getCollection(vote.collectionName);
  const document = collection.findOne({_id: vote.documentId});
  const voteType = vote.type;
  const user = Users.findOne({_id: vote.userId});
  if (document && user) {
    // { document, voteType, collection, user, updateDocument }
    await cancelVoteServer({document, voteType, collection, user, updateDocument: true})
  } else {
    //eslint-disable-next-line no-console
    console.info("No item or user found corresponding to vote: ", vote, document, user, voteType);
  }
}

const nullifyVotesForUserAndCollection = async (user: DbUser, collection) => {
  const collectionName = Utils.capitalize(collection._name);
  const votes = await Votes.find({
    collectionName: collectionName,
    userId: user._id,
    cancelled: false,
  }).fetch();
  for (let vote of votes) {
    //eslint-disable-next-line no-console
    console.log("reversing vote: ", vote)
    await reverseVote(vote);
  };
  //eslint-disable-next-line no-console
  console.info(`Nullified ${votes.length} votes for user ${user.username}`);
}

async function nullifyCommentVotes(user: DbUser) {
  await nullifyVotesForUserAndCollection(user, Comments);
  return user;
}
addCallback("users.nullifyVotes.async", nullifyCommentVotes)

async function nullifyPostVotes(user: DbUser) {
  await nullifyVotesForUserAndCollection(user, Posts);
  return user;
}
addCallback("users.nullifyVotes.async", nullifyPostVotes)

async function userDeleteContent(user: DbUser) {
  //eslint-disable-next-line no-console
  console.warn("Deleting all content of user: ", user)
  const posts = Posts.find({userId: user._id}).fetch();
  //eslint-disable-next-line no-console
  console.info("Deleting posts: ", posts);
  for (let post of posts) {
    await editMutation({
      collection: Posts,
      documentId: post._id,
      set: {status: 5},
      unset: {},
      currentUser: user,
      validate: false,
    })

    const notifications = Notifications.find({documentId: post._id}).fetch();
    //eslint-disable-next-line no-console
    console.info(`Deleting notifications for post ${post._id}: `, notifications);
    for (let notification of notifications) {
      await removeMutation({
        collection: Notifications,
        documentId: notification._id,
        validate: false,
      })
    }

    const reports = Reports.find({postId: post._id}).fetch();
    //eslint-disable-next-line no-console
    console.info(`Deleting reports for post ${post._id}: `, reports);
    for (let report of reports) {
      await editMutation({
        collection: Reports,
        documentId: report._id,
        set: {closedAt: new Date()},
        unset: {},
        currentUser: user,
        validate: false,
      })
    }
    
    runCallbacksAsync('posts.purge.async', post)
  }

  const comments = Comments.find({userId: user._id}).fetch();
  //eslint-disable-next-line no-console
  console.info("Deleting comments: ", comments);
  for (let comment of comments) {
    if (!comment.deleted) {
      await editMutation({
        collection: Comments,
        documentId: comment._id,
        set: {deleted: true, deletedDate: new Date()},
        unset: {},
        currentUser: user,
        validate: false,
      })
    }

    const notifications = Notifications.find({documentId: comment._id}).fetch();
    //eslint-disable-next-line no-console
    console.info(`Deleting notifications for comment ${comment._id}: `, notifications);
    for (let notification of notifications) {
      await removeMutation({
        collection: Notifications,
        documentId: notification._id,
        validate: false,
      })
    }

    const reports = Reports.find({commentId: comment._id}).fetch();
    //eslint-disable-next-line no-console
    console.info(`Deleting reports for comment ${comment._id}: `, reports);
    for (let report of reports) {
      await editMutation({
        collection: Reports,
        documentId: report._id,
        set: {closedAt: new Date()},
        unset: {},
        currentUser: user,
        validate: false,
      })
    }

    runCallbacksAsync('comments.purge.async', comment)
  }
  //eslint-disable-next-line no-console
  console.info("Deleted n posts and m comments: ", posts.length, comments.length);
}
addCallback("users.deleteContent.async", userDeleteContent);

function userResetLoginTokens(user: DbUser) {
  Users.update({_id: user._id}, {$set: {"services.resume.loginTokens": []}});
}
addCallback("users.ban.async", userResetLoginTokens);

async function userIPBan(user: DbUser) {
  const query = `
    query UserIPBan($userId:String) {
      user(input:{selector: {_id: $userId}}) {
        result {
          IPs
        }
      }
    }
  `;
  const IPs: any = await runQuery(query, {userId: user._id});
  if (IPs) {
    await asyncForeachSequential(IPs.data.user.result.IPs as Array<string>, async ip => {
      let tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const ban: Partial<DbBan> = {
        expirationDate: tomorrow,
        userId: user._id,
        reason: "User account banned",
        comment: "Automatic IP ban",
        ip: ip,
      }
      await newMutation({
        collection: Bans,
        document: ban,
        currentUser: user,
        validate: false,
      })
    })
  }

}
addCallback("users.ban.async", userIPBan);

function fixUsernameOnExternalLogin(user: DbUser) {
  if (!user.username) {
    user.username = user.slug;
  }
  return user;
}
addCallback("users.new.sync", fixUsernameOnExternalLogin);

function fixUsernameOnGithubLogin(user: DbUser) {
  if (user.services && user.services.github) {
    //eslint-disable-next-line no-console
    console.info("Github login detected, setting username and slug manually");
    user.username = user.services.github.username
    const basicSlug = Utils.slugify(user.services.github.username)
    user.slug = Utils.getUnusedSlugByCollectionName('Users', basicSlug)
  }
  return user;
}
addCallback("users.new.sync", fixUsernameOnGithubLogin);

function updateReadStatus(event: DbLWEvent) {
  if (event.userId && event.documentId) {
    ReadStatuses.update({
      postId: event.documentId,
      userId: event.userId,
    }, {
      $set: {
        isRead: true,
        lastUpdated: event.createdAt
      }
    }, {
      upsert: true
    });
  }
}
addCallback('lwevents.new.sync', updateReadStatus);
