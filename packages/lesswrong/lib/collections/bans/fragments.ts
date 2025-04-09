import { frag } from "@/lib/fragments/fragmentWrapper";
import { UsersMinimumInfo } from "../users/fragments";

export const BansAdminPageFragment = () => gql`
  fragment BansAdminPageFragment on Ban {
    _id
    createdAt
    expirationDate
    userId
    user {
      ${UsersMinimumInfo}
    }
    reason
    comment
    ip
    properties
  }
`
