import * as _ from 'underscore'
import {createNotifications} from '../notificationCallbacksHelpers'
import { notificationDocumentTypes } from '../collections/notifications/constants'
import {isBeingUndrafted} from './utils'
import {canMention} from '../../lib/pingback'
import { collectionNameToTypeName } from '@/lib/generated/collectionTypeNames'

export interface PingbackDocumentPartial {
  _id: string,
  pingbacks?: {
    Users: string[]
  }
}

export const notifyUsersAboutMentions = async (currentUser: DbUser, collectionName: CollectionNameString, document: PingbackDocumentPartial, oldDocument?: PingbackDocumentPartial) => {
  const pingbacksToSend = getPingbacksToSend(currentUser, collectionName, document, oldDocument)

  // Todo(PR): this works, but not sure if it's generally a correct conversion. 
  //  TagRels for example won't work, though they don't have content either.
  //  should we define an explicit mapping?
  const notificationType = collectionNameToTypeName[collectionName].toLowerCase();

  const newDocPingbackCount = getPingbacks(document).length
  if (!canMention(currentUser, newDocPingbackCount).result || !notificationDocumentTypes.has(notificationType)) {
    return
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
