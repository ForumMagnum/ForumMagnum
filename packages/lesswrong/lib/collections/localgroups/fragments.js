import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment localGroupsHomeFragment on Localgroup {
    _id
    createdAt
    organizerIds
    organizers {
      ...UsersMinimumInfo
    }
    lastActivity
    name
    location
    googleLocation
    mongoLocation
    type
    types
    description
    contactInfo
    facebookLink
    website
  }
`);
