import { gql } from "@/lib/crud/wrapGql";

export const PetrovDayLaunchInfo = gql(`
  fragment PetrovDayLaunchInfo on PetrovDayLaunch {
    _id
    createdAt
    launchCode
    userId
  }
`)
