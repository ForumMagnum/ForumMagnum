import { registerFragment } from 'meteor/vulcan:core';

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
    userId
    name
    properties
  }
`);
