export const localGroupsBase = `
  fragment localGroupsBase on Localgroup {
    _id
    createdAt
    organizerIds
    organizers {
      ...UsersMinimumInfo
    }
    lastActivity
    name
    nameInAnotherLanguage
    isOnline
    location
    googleLocation
    mongoLocation
    types
    categories
    contactInfo
    facebookLink
    facebookPageLink
    meetupLink
    slackLink
    website
    bannerImageId
    inactive
    deleted
  }
`

export const localGroupsHomeFragment = `
  fragment localGroupsHomeFragment on Localgroup {
    ...localGroupsBase
    contents {
      ...RevisionDisplay
    }
  }
`

export const localGroupsEdit = `
  fragment localGroupsEdit on Localgroup {
    ...localGroupsBase
    contents {
      ...RevisionEdit
    }
  }
`

export const localGroupsIsOnline = `
  fragment localGroupsIsOnline on Localgroup {
    _id
    name
    isOnline
  }
`
