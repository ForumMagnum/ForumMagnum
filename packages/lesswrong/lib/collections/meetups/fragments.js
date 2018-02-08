import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment meetupsMainFragment on Meetups {
    _id
    createdAt
    organizerIds
    organizers {
      ...UsersMinimumInfo
    }
    name
    location
    googleLocation
    description
  }
`);
