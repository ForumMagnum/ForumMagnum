import { gql } from "@/lib/generated/gql-codegen/gql";

export const PetrovDayActionInfo = () => gql(`
  fragment PetrovDayActionInfo on PetrovDayAction {
    _id
    createdAt
    userId
    actionType
    data
  }
`)
