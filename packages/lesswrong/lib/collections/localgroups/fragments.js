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
    types
    content {
      version
      updateType
      editedAt
      userId
      canonicalContent
      html
      markdown
      draftJS
      wordCount
      htmlHighlight
      plaintextDescription
    }
    body
    contactInfo
    facebookLink
    website
  }
`);
