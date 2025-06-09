import { gql } from "@/lib/generated/gql-codegen";

export const GoogleServiceAccountSessionInfo = gql(`
  fragment GoogleServiceAccountSessionInfo on GoogleServiceAccountSession {
    _id
    email
  }
`)

export const GoogleServiceAccountSessionAdminInfo = gql(`
  fragment GoogleServiceAccountSessionAdminInfo on GoogleServiceAccountSession {
    _id
    email
    estimatedExpiry
  }
`)
