import { addGraphQLMutation, addGraphQLResolvers } from "../../lib/vulcan-lib/graphql";
import { refreshSettingsCaches } from "../loadDatabaseSettings";

addGraphQLMutation("RefreshDbSettings: Boolean");
addGraphQLResolvers({
  Mutation: {
    async RefreshDbSettings(_: void, __: void, {currentUser}: ResolverContext) {
      if (!currentUser?.isAdmin) {
        throw new Error("You must be an admin to refresh the settings cache");
      }
      await refreshSettingsCaches();
      return true;
    }
  }
});
