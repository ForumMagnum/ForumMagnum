import * as _ from 'underscore'
import {createNotifications} from '../notificationCallbacksHelpers'
import {notificationDocumentTypes} from '../../lib/notificationTypes'
import {isBeingUndrafted} from './utils'

export interface PingbackDocumentPartial {
  _id: string,
  pingbacks?: {
    Users: string[]
  }
}

export const notifyUsersAboutMentions = async (currentUser: DbUser, collectionType: string, document: PingbackDocumentPartial, oldDocument?: PingbackDocumentPartial) => {
  const pingbacksToSend = getPingbacksToSend(currentUser, collectionType, document, oldDocument)

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

function getPingbacksToSend(
  currentUser: DbUser,
  collectionType: string,
  document: PingbackDocumentPartial,
  oldDocument?: PingbackDocumentPartial,
) {
  const pingbacksFromDocuments = () => {
    const newDocPingbacks = document.pingbacks?.Users ?? []
    const oldDocPingbacks = oldDocument?.pingbacks?.Users ?? []
    const newPingbacks = _.difference(newDocPingbacks, oldDocPingbacks)

    if (collectionType !== 'Post') return newPingbacks

    const post = document as DbPost

    if (post.draft) {
      const pingedUsersWhoHaveAccessToDoc = _.intersection(newPingbacks, post.shareWithUsers)
      return pingedUsersWhoHaveAccessToDoc
    }

    const oldPost = oldDocument as DbPost | undefined
    // This currently does not handle multiple moves between draft and published.
    if (oldPost && isBeingUndrafted(oldPost, post)) {
      const alreadyNotifiedUsers = _.intersection(oldDocPingbacks, oldPost.shareWithUsers)

      // newDocPingbacks bc, we assume most users weren't pinged on the draft stage
      return _.difference(newDocPingbacks, alreadyNotifiedUsers)
    }

    return newPingbacks
  }

  return removeSelfReference(pingbacksFromDocuments(), currentUser._id)
}

const canNotify = (currentUser: DbUser, pingbacks: string[], {
  karmaThreshold = 1,
  newPingbackLimit = 25,
}: { karmaThreshold?: number, newPingbackLimit?: number } = {}) =>
  currentUser.isAdmin ||
  (
    currentUser.karma >= karmaThreshold &&
    pingbacks.length <= newPingbackLimit &&
    !currentUser.conversationsDisabled
  )

const removeSelfReference = (ids: string[], id: string) => _.without(ids, id)
