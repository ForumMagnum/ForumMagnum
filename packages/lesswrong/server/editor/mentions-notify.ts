import intersection from 'lodash/intersection'
import difference from 'lodash/difference'
import without from 'lodash/without'
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

const filterUserIds = (userIds: string[], currentUserId: string): string[] =>
  without(uniq(userIds), currentUserId);

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

  if (pingbacksToSend.Users) {
    promises.push(
      createNotifications({
        notificationType: "newMention",
        userIds: filterUserIds(pingbacksToSend.Users, currentUser._id),
        documentId: document._id,
        documentType: notificationType,
      })
    );
  }

  if (pingbacksToSend.Posts) {
    const posts = await Posts.find({
      _id: { $in: pingbacksToSend.Posts },
    }).fetch();
    const userIds = posts.flatMap(
      (post) => [post.userId, ...getConfirmedCoauthorIds(post)],
    );
    promises.push(
      createNotifications({
        notificationType: "newPingback",
        userIds: filterUserIds(userIds, currentUser._id),
        documentId: document._id,
        documentType: notificationType,
        extraData: { pingbackType: "post" },
      })
    );
  }

  if (pingbacksToSend.Comments) {
    const comments = await Comments.find({
      _id: { $in: pingbacksToSend.Comments },
    }).fetch();
    const userIds = comments.map(({ userId }) => userId);
    promises.push(
      createNotifications({
        notificationType: "newPingback",
        userIds: filterUserIds(userIds, currentUser._id),
        documentId: document._id,
        documentType: notificationType,
        extraData: { pingbackType: "comment" },
      })
    );
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
