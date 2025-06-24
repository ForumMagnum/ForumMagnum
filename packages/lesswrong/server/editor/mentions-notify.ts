import intersection from 'lodash/intersection'
import difference from 'lodash/difference'
import uniq from 'lodash/uniq'
import {createNotifications} from '../notificationCallbacksHelpers'
import type {NotificationDocument} from '../../lib/notificationTypes'
import {isBeingUndrafted} from './utils'
import {canMention} from '../../lib/pingback'
import type {PingbacksIndex} from '../pingbacks'
import { isValidCollectionName } from '../collections/allCollections'
import Comments from '../collections/comments/collection'
import Posts from '../collections/posts/collection'
import { getConfirmedCoauthorIds } from '@/lib/collections/posts/helpers'
import { htmlToTextDefault } from '@/lib/htmlToText'
import { dataToHTML } from './conversionUtils'
import { createAnonymousContext } from '../vulcan-lib/createContexts'

const COMMENT_EXCERPT_LENGTH = 40;

export interface PingbackDocumentPartial {
  _id: string,
  pingbacks?: PingbacksIndex,
}

const collectionNotificationTypes: Partial<Record<CollectionNameString, NotificationDocument>> = {
  Posts: "post",
  Comments: "comment",
  Users: "user",
  Messages: "message",
  TagRels: "tagRel",
  Localgroups: "localgroup",
  DialogueChecks: "dialogueCheck",
  DialogueMatchPreferences: "dialogueMatchPreference",
};

const countAllPingbacks = (pingbacks: PingbacksIndex) => {
  let count = 0;
  for (const pingbackCollection in pingbacks) {
    count += pingbacks[pingbackCollection as CollectionNameString]!.length;
  }
  return count;
}

const filterUserIds = (userIds: string[], filteredUserIds: string[]): string[] =>
  difference(uniq(userIds), filteredUserIds);

const getCommentExcerpt = async (comment: DbComment, context: ResolverContext) => {
  const originalContents = comment.contents?.originalContents;
  if (!originalContents) {
    return "";
  }
  const html = await dataToHTML(
    originalContents.data,
    originalContents.type,
    context,
  );
  return htmlToTextDefault(html).slice(0, COMMENT_EXCERPT_LENGTH);
}

export const notifyUsersAboutMentions = async (
  currentUser: DbUser,
  collectionName: CollectionNameString,
  document: PingbackDocumentPartial,
  oldDocument?: PingbackDocumentPartial,
) => {
  const notificationType = collectionNotificationTypes[collectionName];
  if (!notificationType) {
    return;
  }

  if (!canMention(currentUser, countAllPingbacks(document.pingbacks ?? {})).result) {
    return;
  }

  const promises: Promise<unknown>[] = [];

  const pingbacksToSend = getPingbacksToSend(collectionName, document, oldDocument);

  const filteredUserIds: string[] = [currentUser._id];

  if (pingbacksToSend.Users) {
    const userIds = filterUserIds(pingbacksToSend.Users, filteredUserIds);
    filteredUserIds.push(...userIds);
    promises.push(
      createNotifications({
        notificationType: "newMention",
        userIds,
        documentId: document._id,
        documentType: notificationType,
      })
    );
  }

  if (pingbacksToSend.Posts) {
    const posts = await Posts.find({
      _id: { $in: pingbacksToSend.Posts },
    }).fetch();
    for (const post of posts) {
      const userIds = filterUserIds(
        [post.userId, ...getConfirmedCoauthorIds(post)],
        filteredUserIds,
      );
      filteredUserIds.push(...userIds);
      promises.push(
        createNotifications({
          notificationType: "newPingback",
          userIds,
          documentId: document._id,
          documentType: notificationType,
          extraData: {
            pingbackType: "post",
            pingbackDocumentId: post._id,
            pingbackDocumentExcerpt: post.title,
          },
        })
      );
    }
  }

  if (pingbacksToSend.Comments) {
    const comments = await Comments.find({
      _id: { $in: pingbacksToSend.Comments },
    }).fetch();
    const context = createAnonymousContext();
    for (const comment of comments) {
      const userIds = filterUserIds([comment.userId], filteredUserIds);
      filteredUserIds.push(...userIds);
      promises.push(
        createNotifications({
          notificationType: "newPingback",
          userIds,
          documentId: document._id,
          documentType: notificationType,
          extraData: {
            pingbackType: "comment",
            pingbackDocumentId: comment._id,
            pingbackDocumentExcerpt: await getCommentExcerpt(comment, context),
          },
        })
      );
    }
  }

  return Promise.all(promises);
}

const getPingbacksToSend = (
  collectionName: CollectionNameString,
  document: PingbackDocumentPartial,
  oldDocument?: PingbackDocumentPartial,
): PingbacksIndex => {
  const pingbacksFromDocuments = (pingbackCollection: CollectionNameString) => {
    const newDocPingbacks = document.pingbacks?.[pingbackCollection] ?? [];
    const oldDocPingbacks = oldDocument?.pingbacks?.[pingbackCollection] ?? [];
    const newPingbacks = difference(newDocPingbacks, oldDocPingbacks)

    if (collectionName !== 'Posts' && collectionName !== 'Comments') {
      return newPingbacks
    }

    const doc = document as DbPost | DbComment
    const oldDoc = oldDocument as DbPost | DbComment | undefined

    if (doc.draft) {
      if (collectionName === 'Posts') {
        const post = doc as DbPost
        const pingedUsersWhoHaveAccessToDoc = intersection(newPingbacks, post.shareWithUsers)
        return pingedUsersWhoHaveAccessToDoc
      }
      return []
    }

    // This currently does not handle multiple moves between draft and published.
    if (oldDoc && isBeingUndrafted(oldDoc, doc)) {
      let alreadyNotifiedUsers: string[] = []
      if (collectionName === 'Posts') {
        alreadyNotifiedUsers = intersection(oldDocPingbacks, (oldDoc as DbPost).shareWithUsers)
      }

      return difference(newDocPingbacks, alreadyNotifiedUsers);
    }

    return newPingbacks;
  }

  const result: PingbacksIndex = {};
  for (const pingbackCollection in document.pingbacks) {
    if (isValidCollectionName(pingbackCollection)) {
      result[pingbackCollection] = pingbacksFromDocuments(pingbackCollection);
    }
  }
  return result;
}
