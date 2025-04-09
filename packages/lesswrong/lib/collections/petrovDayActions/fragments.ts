import { frag } from "@/lib/fragments/fragmentWrapper";

export const PetrovDayActionInfo = () => gql`
  fragment PetrovDayActionInfo on PetrovDayAction {
    _id
    createdAt
    userId
    actionType
    data
  }
`
