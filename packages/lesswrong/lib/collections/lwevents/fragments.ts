import { registerFragment } from '../../vulcan-lib/fragments';
import { addGraphQLSchema } from '../../vulcan-lib/graphql';

registerFragment(`
  fragment newEventFragment on LWEvent {
    _id
    createdAt
    userId
    name
    important
    properties
    intercom
  }
`);

registerFragment(`
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
`);

registerFragment(`
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
`);

registerFragment(`
  fragment emailHistoryFragment on LWEvent {
    _id
    createdAt
    userId
    name
    properties
  }
`);

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

registerFragment(`
  fragment FieldChangeFragment on FieldChange {
    _id
    createdAt
    userId
    documentId
    before
    after
  }
`);
