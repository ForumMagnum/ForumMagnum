import gql from "graphql-tag"
import { userIsAdmin } from "../../lib/vulcan-users/permissions";
import { revokeAllAccessTokens } from "../posts/googleDocImport";

export const adminGqlTypeDefs = gql`
  extend type Mutation {
    revokeGoogleServiceAccountTokens: Boolean!
  }
`

export const adminGqlMutations = {
  async revokeGoogleServiceAccountTokens (_root: void, _args: {}, context: ResolverContext) {
    const { currentUser } = context;
    if (!userIsAdmin(currentUser)) {
      throw new Error("Only admins can revoke access tokens");
    }

    await revokeAllAccessTokens();

    return true;
  }
}
