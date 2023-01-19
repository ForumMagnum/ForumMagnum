import * as _ from 'underscore'
import {createNotifications} from '../notificationCallbacksHelpers'
import {notificationDocumentTypes} from '../../lib/notificationTypes'

export interface PingbackDocumentPartial {
  _id: string,
  pingbacks?: {
    Users: string[]
  }
}

export const notify = async (currentUser: DbUser, collectionType: string, document: PingbackDocumentPartial, oldDocument?: PingbackDocumentPartial) => {
  const pingbacksToSend = getPingbacksToSend(currentUser, document, oldDocument)

  // Todo(PR): this works, but not sure if it's generally a correct conversion. 
  //  TagRels for example won't work, though they don't have content either.
  //  should we define an explicit mapping?
  const notificationType = collectionType.toLowerCase()
  if (!canNotify(currentUser, pingbacksToSend) || !notificationDocumentTypes.has(notificationType)) return

  return createNotifications({
    notificationType: 'newMention',
    userIds: pingbacksToSend,
    documentId: document._id,
    documentType: notificationType,
  })
}

function getPingbacksToSend(currentUser: DbUser, document: PingbackDocumentPartial, oldDocument?: PingbackDocumentPartial) {
  const newDocPingbacks = document.pingbacks?.Users ?? []
  const oldDocPingbacks = oldDocument?.pingbacks?.Users ?? []

  const newPingbacks = _.difference(newDocPingbacks, oldDocPingbacks)
  return removeSelfReference(newPingbacks, currentUser._id)
}

const canNotify = (currentUser: DbUser, pingbacks: string[], {
  karmaThreshold = 1,
  // Todo(PR): rn it is *New* pingback limit, should it be total? 
  newPingbackLimit = 3,
}: { karmaThreshold?: number, newPingbackLimit?: number } = {}) =>
  currentUser.karma >= karmaThreshold &&
  pingbacks.length <= newPingbackLimit &&
  !currentUser.conversationsDisabled

const removeSelfReference = (ids: string[], id: string) => _.without(ids, id)
