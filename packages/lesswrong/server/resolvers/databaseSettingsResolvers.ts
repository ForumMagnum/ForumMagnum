import gql from "graphql-tag"
import { refreshSettingsCaches } from "../loadDatabaseSettings";

export const databaseSettingsGqlTypeDefs = gql`
  extend type Mutation {
    RefreshDbSettings: Boolean
  }
`

export const databaseSettingsGqlMutations = {
  async RefreshDbSettings(_: void, __: void, {currentUser}: ResolverContext) {
    if (!currentUser?.isAdmin) {
      throw new Error("You must be an admin to refresh the settings cache");
    }
    await refreshSettingsCaches();
    return true;
  }
}
