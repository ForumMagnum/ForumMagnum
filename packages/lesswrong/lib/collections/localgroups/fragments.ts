import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment localGroupsBase on Localgroup {
    _id
    createdAt
    organizerIds
    organizers {
      ...UsersMinimumInfo
    }
    lastActivity
    name
    isOnline
    location
    googleLocation
    mongoLocation
    types
    contactInfo
    facebookLink
    facebookPageLink
    meetupLink
    slackLink
    website
    inactive
    bannerImageId
  }
`);

registerFragment(`
  fragment localGroupsHomeFragment on Localgroup {
    ...localGroupsBase
    contents {
      ...RevisionDisplay
    }
  }
`);

registerFragment(`
  fragment localGroupsEdit on Localgroup {
    ...localGroupsBase
    contents {
      ...RevisionEdit
    }
  }
`);

registerFragment(`
  fragment localGroupsIsOnline on Localgroup {
    _id
    name
    isOnline
  }
`);
