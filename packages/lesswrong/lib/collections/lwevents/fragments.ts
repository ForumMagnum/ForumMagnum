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

addGraphQLSchema(`
  type FieldChange {
    _id: String!
    createdAt: Date!
    userId: String!
    documentId: String!
    before: JSON!
    after: JSON!
  }
`);

export type FieldChangeResult<N extends CollectionNameString> = {
  _id: string
  createdAt: Date
  userId: string
  documentId: string
  before: Partial<ObjectsByCollectionName[N]>
  after: Partial<ObjectsByCollectionName[N]>
}

export const FieldChangeFragment = `
  fragment FieldChangeFragment on FieldChange {
    _id
    createdAt
    userId
    documentId
    before
    after
  }
`
