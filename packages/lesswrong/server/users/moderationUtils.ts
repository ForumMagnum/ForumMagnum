import { postStatuses } from "@/lib/collections/posts/constants";
import Reports from "@/server/collections/reports/collection";
import Sequences from "@/server/collections/sequences/collection";
import { asyncForeachSequential } from "@/lib/utils/asyncUtils";
import { getCollection } from "@/server/collections/allCollections";
import { postReportPurgeAsSpam, commentReportPurgeAsSpam } from "../akismet";
import { syncDocumentWithLatestRevision } from "../editor/utils";
import UsersRepo from "../repos/UsersRepo";
import { createBan } from "../collections/bans/mutations";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import { updateTag } from "../collections/tags/mutations";
import { updatePost } from "../collections/posts/mutations";
import { updateComment } from "../collections/comments/mutations";
import { updateReport } from "../collections/reports/mutations";
import { updateSequence } from "../collections/sequences/mutations";
import { updateNotification } from "../collections/notifications/mutations";
import { inspect } from "util";



/**
 * Add user IP address to IP ban list for a day and remove their login tokens
 *
 * NB: We haven't tested the IP ban list in like 3 years and it should not be
 * assumed to work.
 */
export async function userIPBanAndResetLoginTokens(user: DbUser) {
  const { runQuery }: typeof import('../vulcan-lib/query') = require('../vulcan-lib/query');
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
  try {
    if (IPs) {
      throw new Error("x")
      await asyncForeachSequential(IPs.data.user.result.IPs as Array<string>, async ip => {
        let tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const ban = {
          expirationDate: tomorrow,
          userId: user._id,
          reason: "User account banned",
          comment: "Automatic IP ban",
          ip: ip,
        }
        const userContext = await computeContextFromUser({ user, isSSR: false });
        await createBan({ data: ban }, userContext);
      })
    }
  } catch (e) {
    /* eslint-disable no-console */
    console.error("User object:");
    console.error(inspect(user, { depth: null, colors: true }));
    console.error("IPs object (raw result from runQuery):");
    console.error(inspect(IPs, { depth: null, colors: true }));
    console.error("Caught error details:");
    console.error(inspect(e, { showHidden: true, depth: null, colors: true }));
    /* eslint-enable no-console */
    throw e;
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
        await updateTag({ data: {deleted: true}, selector: { _id: tag._id } }, context)
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
        revision.fieldName,
        context
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
    await updatePost({ data: {status: postStatuses.STATUS_DELETED}, selector: { _id: post._id } }, context)

    const notifications = await Notifications.find({documentId: post._id}).fetch();
    //eslint-disable-next-line no-console
    console.info(`Deleting notifications for post ${post._id}: `, notifications);
    for (let notification of notifications) {
      await updateNotification({ data: { deleted: true }, selector: { _id: notification._id } }, context);
    }

    const reports = await Reports.find({postId: post._id}).fetch();
    //eslint-disable-next-line no-console
    console.info(`Deleting reports for post ${post._id}: `, reports);
    for (let report of reports) {
      await updateReport({ data: {closedAt: new Date()}, selector: { _id: report._id } }, context)
    }
    
    await postReportPurgeAsSpam(post, context);
  }

  const comments = await Comments.find({userId: user._id}).fetch();
  //eslint-disable-next-line no-console
  console.info("Deleting comments: ", comments);
  for (let comment of comments) {
    if (!comment.deleted) {
      try {
        await updateComment({ data: {deleted: true, deletedDate: new Date()}, selector: { _id: comment._id } }, context)
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
      await updateNotification({ data: { deleted: true }, selector: { _id: notification._id } }, context);
    }

    const reports = await Reports.find({commentId: comment._id}).fetch();
    //eslint-disable-next-line no-console
    console.info(`Deleting reports for comment ${comment._id}: `, reports);
    for (let report of reports) {
      await updateReport({ data: {closedAt: new Date()}, selector: { _id: report._id } }, context)
    }

    await commentReportPurgeAsSpam(comment, context);
  }
  
  const sequences = await Sequences.find({userId: user._id}).fetch();
  //eslint-disable-next-line no-console
  console.info("Deleting sequences: ", sequences);
  for (let sequence of sequences) {
    await updateSequence({ data: {isDeleted: true}, selector: { _id: sequence._id } }, context)
  }
  
  if (deleteTags) {
    await deleteUserTagsAndRevisions(user, deletingUser, context)
  }

  //eslint-disable-next-line no-console
  console.info("Deleted n posts and m comments: ", posts.length, comments.length);
}
