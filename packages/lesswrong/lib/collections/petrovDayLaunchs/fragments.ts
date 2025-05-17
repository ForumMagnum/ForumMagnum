import { gql } from "@/lib/generated/gql-codegen/gql";

export const PetrovDayLaunchInfo = gql(`
  fragment PetrovDayLaunchInfo on PetrovDayLaunch {
    _id
    createdAt
    launchCode
    userId
  }
`)
