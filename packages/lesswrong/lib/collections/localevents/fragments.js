import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment localEventsHomeFragment on LocalEvent {
    _id
    createdAt
    organizerIds
    organizers {
      ...UsersMinimumInfo
    }
    name
    topic
    time
    description
    location
    googleLocation
    mongoLocation
    contactInfo
    facebookEvent
    website
  }
`);
