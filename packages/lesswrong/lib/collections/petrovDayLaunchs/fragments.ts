import { frag } from "@/lib/fragments/fragmentWrapper";

export const PetrovDayLaunchInfo = () => frag`
  fragment PetrovDayLaunchInfo on PetrovDayLaunch {
    _id
    createdAt
    launchCode
    userId
  }
`
