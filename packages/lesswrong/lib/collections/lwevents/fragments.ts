import { gql } from "@/lib/generated/gql-codegen/gql";

export const newEventFragment = gql(`
  fragment newEventFragment on LWEvent {
    _id
    createdAt
    userId
    name
    important
    properties
    intercom
  }
`)

export const lastEventFragment = gql(`
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
`)

export const lwEventsAdminPageFragment = gql(`
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
`)

export const emailHistoryFragment = gql(`
  fragment emailHistoryFragment on LWEvent {
    _id
    createdAt
    userId
    name
    properties
  }
`)
