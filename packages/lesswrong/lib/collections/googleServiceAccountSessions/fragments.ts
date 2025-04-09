import { frag } from "@/lib/fragments/fragmentWrapper"

export const GoogleServiceAccountSessionInfo = () => gql`
  fragment GoogleServiceAccountSessionInfo on GoogleServiceAccountSession {
    _id
    email
  }
`

export const GoogleServiceAccountSessionAdminInfo = () => gql`
  fragment GoogleServiceAccountSessionAdminInfo on GoogleServiceAccountSession {
    _id
    email
    estimatedExpiry
  }
`
