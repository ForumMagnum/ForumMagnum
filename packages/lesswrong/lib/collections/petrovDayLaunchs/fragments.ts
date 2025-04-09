import { frag } from "@/lib/fragments/fragmentWrapper";

export const PetrovDayLaunchInfo = () => gql`
  fragment PetrovDayLaunchInfo on PetrovDayLaunch {
    _id
    createdAt
    launchCode
    userId
  }
`
