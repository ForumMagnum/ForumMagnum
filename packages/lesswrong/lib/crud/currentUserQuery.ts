import { gql } from "../generated/gql-codegen";

export const CurrentUserQuery = gql(`
  query getCurrentUser {
    currentUser {
      ...UsersCurrent
    }
  }
`);
