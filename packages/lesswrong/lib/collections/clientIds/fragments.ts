import { frag } from "@/lib/fragments/fragmentWrapper";
import { UsersMinimumInfo } from "../users/fragments";

export const ModeratorClientIDInfo = () => gql`
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
