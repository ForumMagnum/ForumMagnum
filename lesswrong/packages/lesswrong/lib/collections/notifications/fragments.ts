import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment NotificationsList on Notification {
    _id
    documentId
    documentType
    deleted
    userId
    createdAt
    link
    message
    type
    viewed
    extraData
  }
`);
