import { gql } from "@/lib/generated/gql-codegen";

export const CurrentUserQuery = gql(`
  query getCurrentUser {
    currentUser {
      ...UsersCurrent
    }
  }
`);
