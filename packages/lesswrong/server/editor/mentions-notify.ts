import * as _ from 'underscore'
import {createNotifications} from '../notificationCallbacksHelpers'
import type {NotificationDocument} from '../../lib/notificationTypes'
import {isBeingUndrafted} from './utils'
import {canMention} from '../../lib/pingback'

export interface PingbackDocumentPartial {
  _id: string,
  pingbacks?: {
    Users: string[]
  }
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

export const notifyUsersAboutMentions = async (currentUser: DbUser, collectionName: CollectionNameString, document: PingbackDocumentPartial, oldDocument?: PingbackDocumentPartial) => {
  const pingbacksToSend = getPingbacksToSend(currentUser, collectionName, document, oldDocument)

  const notificationType = collectionNotificationTypes[collectionName];
  if (!notificationType) {
    return;
  }

  const newDocPingbackCount = getPingbacks(document).length
  if (!canMention(currentUser, newDocPingbackCount).result) {
    return;
  }

  return createNotifications({
    notificationType: 'newMention',
    userIds: pingbacksToSend,
    documentId: document._id,
    documentType: notificationType,
  })
}

const getPingbacks = (document?: PingbackDocumentPartial) => document?.pingbacks?.Users ?? []

function getPingbacksToSend(
  currentUser: DbUser,
  collectionName: CollectionNameString,
  document: PingbackDocumentPartial,
  oldDocument?: PingbackDocumentPartial,
) {
  const pingbacksFromDocuments = () => {
    const newDocPingbacks = getPingbacks(document)
    const oldDocPingbacks = getPingbacks(oldDocument)
    const newPingbacks = _.difference(newDocPingbacks, oldDocPingbacks)

    if (collectionName !== 'Posts' && collectionName !== 'Comments') {
      return newPingbacks
    }

    const doc = document as DbPost | DbComment
    const oldDoc = oldDocument as DbPost | DbComment | undefined

    if (doc.draft) {
      if (collectionName === 'Posts') {
        const post = doc as DbPost
        const pingedUsersWhoHaveAccessToDoc = _.intersection(newPingbacks, post.shareWithUsers)
        return pingedUsersWhoHaveAccessToDoc
      }
      return []
    }

    // This currently does not handle multiple moves between draft and published.
    if (oldDoc && isBeingUndrafted(oldDoc, doc)) {
      let alreadyNotifiedUsers: string[] = []
      if (collectionName === 'Posts') {
        alreadyNotifiedUsers = _.intersection(oldDocPingbacks, (oldDoc as DbPost).shareWithUsers)
      }

      return _.difference(newDocPingbacks, alreadyNotifiedUsers)
    }

    return newPingbacks
  }

  return removeSelfReference(pingbacksFromDocuments(), currentUser._id)
}

const removeSelfReference = (ids: string[], id: string) => _.without(ids, id)
