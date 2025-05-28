import { gql } from "@/lib/generated/gql-codegen/gql";

export const localGroupsBase = gql(`
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
`)

export const localGroupsHomeFragment = gql(`
  fragment localGroupsHomeFragment on Localgroup {
    ...localGroupsBase
    contents {
      ...RevisionDisplay
    }
  }
`)

export const localGroupsEdit = gql(`
  fragment localGroupsEdit on Localgroup {
    ...localGroupsBase
    contents {
      ...RevisionEdit
    }
  }
`)

export const localGroupsIsOnline = gql(`
  fragment localGroupsIsOnline on Localgroup {
    _id
    name
    isOnline
  }
`)
