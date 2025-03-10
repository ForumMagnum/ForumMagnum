export const GoogleServiceAccountSessionInfo = `
  fragment GoogleServiceAccountSessionInfo on GoogleServiceAccountSession {
    _id
    email
  }
`

export const GoogleServiceAccountSessionAdminInfo = `
  fragment GoogleServiceAccountSessionAdminInfo on GoogleServiceAccountSession {
    _id
    email
    estimatedExpiry
  }
`
