import { frag } from "@/lib/fragments/fragmentWrapper";

export const NotificationsList = () => frag`
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
