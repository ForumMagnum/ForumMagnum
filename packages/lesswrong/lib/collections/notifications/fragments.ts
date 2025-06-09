import { gql } from "@/lib/generated/gql-codegen";

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
