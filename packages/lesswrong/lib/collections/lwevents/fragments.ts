import { frag } from "@/lib/fragments/fragmentWrapper"

export const newEventFragment = () => frag`
  fragment newEventFragment on LWEvent {
    _id
    createdAt
    userId
    name
    important
    properties
    intercom
  }
`

export const lastEventFragment = () => frag`
  fragment lastEventFragment on LWEvent {
    _id
    createdAt
    documentId
    userId
    name
    important
    properties
    intercom
  }
`

export const lwEventsAdminPageFragment = () => frag`
  fragment lwEventsAdminPageFragment on LWEvent {
    _id
    createdAt
    userId
    user {
      ...UsersMinimumInfo
    }
    name
    documentId
    important
    properties
    intercom
  }
`

export const emailHistoryFragment = () => frag`
  fragment emailHistoryFragment on LWEvent {
    _id
    createdAt
    userId
    name
    properties
  }
`
