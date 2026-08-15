import gql from "graphql-tag";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import {
  HIGHLIGHT_RULE_OVERRIDES_METADATA_NAME,
  parseHighlightRuleOverrides,
  serializeHighlightRuleOverrides,
  type HighlightRuleOverrides,
} from "@/lib/moderatorHighlights/highlightRuleTypes";

/**
 * Storage for moderator-edited supermod highlight rules. These are a sparse set of overrides
 * on top of the defaults in the code, kept in a single DatabaseMetadata row so that editing
 * them doesn't need a schema change.
 */

export const supermodHighlightRuleGqlTypeDefs = gql`
  extend type Query {
    supermodHighlightRuleOverrides: JSON
  }
  extend type Mutation {
    setSupermodHighlightRuleOverrides(overrides: JSON!): JSON!
  }
`;

export const supermodHighlightRuleGqlQueries = {
  async supermodHighlightRuleOverrides(_root: void, _args: {}, context: ResolverContext) {
    if (!userIsAdminOrMod(context.currentUser)) {
      throw new Error("You must be a moderator to read the supermod highlight rules");
    }
    const [row] = await context.repos.databaseMetadata.getByNames([HIGHLIGHT_RULE_OVERRIDES_METADATA_NAME]);
    return row?.value ?? null;
  },
};

export const supermodHighlightRuleGqlMutations = {
  async setSupermodHighlightRuleOverrides(_root: void, { overrides }: { overrides: unknown }, context: ResolverContext) {
    if (!userIsAdminOrMod(context.currentUser)) {
      throw new Error("You must be a moderator to edit the supermod highlight rules");
    }
    // Validating here (rather than trusting the editor) keeps a malformed write from breaking
    // highlights for the whole moderation team
    const validated: HighlightRuleOverrides = parseHighlightRuleOverrides(overrides);
    const serialized = serializeHighlightRuleOverrides(validated);
    await context.repos.databaseMetadata.upsertByName(HIGHLIGHT_RULE_OVERRIDES_METADATA_NAME, serialized);
    return serialized;
  },
};
