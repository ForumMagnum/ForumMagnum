import Bans from "@/server/collections/bans/collection";
import Comments from "@/server/collections/comments/collection";
import Posts from "@/server/collections/posts/collection";
import { postStatuses } from "@/lib/collections/posts/constants";
import Reports from "@/server/collections/reports/collection";
import Revisions from "@/server/collections/revisions/collection";
import Sequences from "@/server/collections/sequences/collection";
import { asyncForeachSequential } from "@/lib/utils/asyncUtils";
import { getCollection } from "@/server/collections/allCollections";
import { postReportPurgeAsSpam, commentReportPurgeAsSpam } from "../akismet";
import { syncDocumentWithLatestRevision } from "../editor/utils";
import UsersRepo from "../repos/UsersRepo";
import { createMutator, updateMutator, deleteMutator } from "../vulcan-lib/mutators";
import { runQuery } from "../vulcan-lib/query";
import Tags from "@/server/collections/tags/collection";
import Notifications from "@/server/collections/notifications/collection";
import { userGetGroups } from "@/lib/vulcan-users/permissions";
import type { VoteDocTuple } from "@/lib/voting/vote";

const MODERATE_OWN_PERSONAL_THRESHOLD = 50;
const TRUSTLEVEL1_THRESHOLD = 2000;

export async function updateTrustedStatus({newDocument, vote}: VoteDocTuple, context: ResolverContext) {
  const { Users } = context;

  const user = await Users.findOne(newDocument.userId)
  if (user && (user?.karma) >= TRUSTLEVEL1_THRESHOLD && (!userGetGroups(user).includes('trustLevel1'))) {
    await Users.rawUpdateOne(user._id, {$push: {groups: 'trustLevel1'}});
    const updatedUser = await Users.findOne(newDocument.userId)
    //eslint-disable-next-line no-console
    console.info("User gained trusted status", updatedUser?.username, updatedUser?._id, updatedUser?.karma, updatedUser?.groups)
  }
}

export async function updateModerateOwnPersonal({newDocument, vote}: VoteDocTuple, context: ResolverContext) {
  const { Users } = context;
  
  const user = await Users.findOne(newDocument.userId)
  if (!user) throw Error("Couldn't find user")
  if ((user.karma) >= MODERATE_OWN_PERSONAL_THRESHOLD && (!userGetGroups(user).includes('canModeratePersonal'))) {
    await Users.rawUpdateOne(user._id, {$push: {groups: 'canModeratePersonal'}});
    const updatedUser = await Users.findOne(newDocument.userId)
    if (!updatedUser) throw Error("Couldn't find user to update")
    //eslint-disable-next-line no-console
    console.info("User gained trusted status", updatedUser.username, updatedUser._id, updatedUser.karma, updatedUser.groups)
  }
}

/**
 * Add user IP address to IP ban list for a day and remove their login tokens
 *
 * NB: We haven't tested the IP ban list in like 3 years and it should not be
 * assumed to work.
 */
export async function userIPBanAndResetLoginTokens(user: DbUser) {
  // IP ban
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
      await createMutator({
        collection: Bans,
        document: ban,
        currentUser: user,
        validate: false,
      })
    })
  }

  // Remove login tokens
  await new UsersRepo().clearLoginTokens(user._id);
}


async function deleteUserTagsAndRevisions(user: DbUser, deletingUser: DbUser, context: ResolverContext) {
  const { Tags, Revisions } = context;
  const tags = await Tags.find({userId: user._id}).fetch()
  // eslint-disable-next-line no-console
  console.info("Deleting tags: ", tags)
  for (let tag of tags) {
    if (!tag.deleted) {
      try {
        await updateMutator({
          collection: Tags,
          documentId: tag._id,
          set: {deleted: true},
          currentUser: deletingUser,
          validate: false
        })
      } catch(err) {
        // eslint-disable-next-line no-console
        console.error("Failed to delete tag")
        // eslint-disable-next-line no-console
        console.error(err)
      }
    }
  }
  
  const tagRevisions = await Revisions.find({userId: user._id, collectionName: 'Tags'}).fetch()
  // eslint-disable-next-line no-console
  console.info("Deleting tag revisions: ", tagRevisions)
  await Revisions.rawRemove({userId: user._id})
  // Revert revision documents
  for (let revision of tagRevisions) {
    if (!revision.collectionName) {
      continue;
    }
    const collection = getCollection(revision.collectionName);
    const document = await collection.findOne({_id: revision.documentId})
    if (document && revision.fieldName) {
      await syncDocumentWithLatestRevision(
        collection,
        document,
        revision.fieldName
      )
    }
  }
}

export async function userDeleteContent(user: DbUser, deletingUser: DbUser, context: ResolverContext, deleteTags=true) {
  const { Posts, Comments, Notifications } = context;
  //eslint-disable-next-line no-console
  console.log("Deleting all content of user: ", user)
  const posts = await Posts.find({userId: user._id}).fetch();
  //eslint-disable-next-line no-console
  console.info("Deleting posts: ", posts);
  for (let post of posts) {
    await updateMutator({
      collection: Posts,
      documentId: post._id,
      set: {status: postStatuses.STATUS_DELETED},
      unset: {},
      currentUser: deletingUser,
      validate: false,
    })

    const notifications = await Notifications.find({documentId: post._id}).fetch();
    //eslint-disable-next-line no-console
    console.info(`Deleting notifications for post ${post._id}: `, notifications);
    for (let notification of notifications) {
      await deleteMutator({
        collection: Notifications,
        documentId: notification._id,
        validate: false,
      })
    }

    const reports = await Reports.find({postId: post._id}).fetch();
    //eslint-disable-next-line no-console
    console.info(`Deleting reports for post ${post._id}: `, reports);
    for (let report of reports) {
      await updateMutator({
        collection: Reports,
        documentId: report._id,
        set: {closedAt: new Date()},
        unset: {},
        currentUser: deletingUser,
        validate: false,
      })
    }
    
    await postReportPurgeAsSpam(post, context);
  }

  const comments = await Comments.find({userId: user._id}).fetch();
  //eslint-disable-next-line no-console
  console.info("Deleting comments: ", comments);
  for (let comment of comments) {
    if (!comment.deleted) {
      try {
        await updateMutator({
          collection: Comments,
          documentId: comment._id,
          set: {deleted: true, deletedDate: new Date()},
          unset: {},
          currentUser: deletingUser,
          validate: false,
        })
      } catch(err) {
        //eslint-disable-next-line no-console
        console.error("Failed to delete comment")
        //eslint-disable-next-line no-console
        console.error(err)
      }
    }

    const notifications = await Notifications.find({documentId: comment._id}).fetch();
    //eslint-disable-next-line no-console
    console.info(`Deleting notifications for comment ${comment._id}: `, notifications);
    for (let notification of notifications) {
      await deleteMutator({ // TODO: This should be a soft-delete not a hard-delete
        collection: Notifications,
        documentId: notification._id,
        validate: false,
      })
    }

    const reports = await Reports.find({commentId: comment._id}).fetch();
    //eslint-disable-next-line no-console
    console.info(`Deleting reports for comment ${comment._id}: `, reports);
    for (let report of reports) {
      await updateMutator({
        collection: Reports,
        documentId: report._id,
        set: {closedAt: new Date()},
        unset: {},
        currentUser: deletingUser,
        validate: false,
      })
    }

    await commentReportPurgeAsSpam(comment, context);
  }
  
  const sequences = await Sequences.find({userId: user._id}).fetch();
  //eslint-disable-next-line no-console
  console.info("Deleting sequences: ", sequences);
  for (let sequence of sequences) {
    await updateMutator({
      collection: Sequences,
      documentId: sequence._id,
      set: {isDeleted: true},
      unset: {},
      currentUser: deletingUser,
      validate: false,
    })
  }
  
  if (deleteTags) {
    await deleteUserTagsAndRevisions(user, deletingUser, context)
  }

  //eslint-disable-next-line no-console
  console.info("Deleted n posts and m comments: ", posts.length, comments.length);
}
