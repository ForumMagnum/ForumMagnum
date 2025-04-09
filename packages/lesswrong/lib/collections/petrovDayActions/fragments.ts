import { frag } from "@/lib/fragments/fragmentWrapper";

export const PetrovDayActionInfo = () => frag`
  fragment PetrovDayActionInfo on PetrovDayAction {
    _id
    createdAt
    userId
    actionType
    data
  }
`
