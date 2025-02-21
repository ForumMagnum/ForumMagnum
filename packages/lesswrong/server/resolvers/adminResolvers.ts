import { userIsAdmin } from "../../lib/vulcan-users/permissions";
import { revokeAllAccessTokens } from "../posts/googleDocImport";
import { defineMutation } from "../utils/serverGraphqlUtil";

defineMutation({
  name: "revokeGoogleServiceAccountTokens",
  resultType: "Boolean!",
  fn: async (_root: void, _args, context: ResolverContext) => {
    const { currentUser } = context;
    if (!userIsAdmin(currentUser)) {
      throw new Error("Only admins can revoke access tokens");
    }

    await revokeAllAccessTokens();

    return true;
  }
});
