import { addGraphQLSchema } from '../../vulcan-lib/graphql';

export const newEventFragment = `
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

export const lastEventFragment = `
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

export const lwEventsAdminPageFragment = `
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

export const emailHistoryFragment = `
  fragment emailHistoryFragment on LWEvent {
    _id
    createdAt
    userId
    name
    properties
  }
`
