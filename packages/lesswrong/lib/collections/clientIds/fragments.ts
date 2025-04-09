import { frag } from "@/lib/fragments/fragmentWrapper";
import { UsersMinimumInfo } from "../users/fragments";

export const ModeratorClientIDInfo = () => frag`
  fragment ModeratorClientIDInfo on ClientId {
    _id
    clientId
    createdAt
    firstSeenReferrer
    firstSeenLandingPage
    users {
      ${UsersMinimumInfo}
    }
  }
`;
