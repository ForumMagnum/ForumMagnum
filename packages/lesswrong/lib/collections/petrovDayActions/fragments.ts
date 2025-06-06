import { gql } from "@/lib/crud/wrapGql";

export const PetrovDayActionInfo = gql(`
  fragment PetrovDayActionInfo on PetrovDayAction {
    _id
    createdAt
    userId
    actionType
    data
  }
`)
