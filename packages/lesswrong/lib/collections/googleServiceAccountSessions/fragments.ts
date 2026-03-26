import { gql } from "@/lib/generated/gql-codegen";

export const GoogleServiceAccountSessionAdminInfo = gql(`
  fragment GoogleServiceAccountSessionAdminInfo on GoogleServiceAccountSession {
    _id
    email
    estimatedExpiry
  }
`)
