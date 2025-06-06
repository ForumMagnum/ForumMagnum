import { gql } from "@/lib/crud/wrapGql";

export const NotificationsList = gql(`
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
`)
