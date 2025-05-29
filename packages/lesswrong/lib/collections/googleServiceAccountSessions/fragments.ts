import { frag } from "@/lib/fragments/fragmentWrapper"

export const GoogleServiceAccountSessionInfo = () => frag`
  fragment GoogleServiceAccountSessionInfo on GoogleServiceAccountSession {
    _id
    email
  }
`

export const GoogleServiceAccountSessionAdminInfo = () => frag`
  fragment GoogleServiceAccountSessionAdminInfo on GoogleServiceAccountSession {
    _id
    email
    estimatedExpiry
  }
`
