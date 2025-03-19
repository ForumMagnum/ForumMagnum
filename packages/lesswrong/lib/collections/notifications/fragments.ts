export const NotificationsList = `
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
`
