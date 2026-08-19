import gql from "graphql-tag";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import {
  HIGHLIGHT_RULE_OVERRIDES_METADATA_NAME,
  migrateLegacyTemplateRuleOverrideKeys,
  parseHighlightRuleOverrides,
  serializeHighlightRuleOverrides,
  type HighlightRuleOverrides,
} from "@/lib/moderatorHighlights/highlightRuleTypes";

export const supermodHighlightRuleGqlTypeDefs = gql`
  extend type Query {
    supermodHighlightRuleOverrides: JSON
  }
  extend type Mutation {
    setSupermodHighlightRuleOverrides(overrides: JSON!): JSON!
  }
`;

async function getModerationTemplateReferences(context: ResolverContext) {
  return context.ModerationTemplates.find(
    { collectionName: { $in: ['Messages', 'Rejections'] } },
    {},
    { _id: 1, name: 1, collectionName: 1 },
  ).fetch();
}

export const supermodHighlightRuleGqlQueries = {
  async supermodHighlightRuleOverrides(_root: void, _args: {}, context: ResolverContext) {
    if (!userIsAdminOrMod(context.currentUser)) {
      throw new Error("You must be a moderator to read the supermod highlight rules");
    }
    const [row] = await context.repos.databaseMetadata.getByNames([HIGHLIGHT_RULE_OVERRIDES_METADATA_NAME]);
    if (!row?.value) return null;
    let parsed: HighlightRuleOverrides;
    try {
      parsed = parseHighlightRuleOverrides(row.value);
    } catch {
      // Hand the unparseable value back rather than throwing: the client falls back to the
      // defaults either way, and this keeps the raw row readable through the API for debugging.
      // Note the editor will then show an empty override set, so the next save overwrites it.
      return row.value;
    }
    const templates = await getModerationTemplateReferences(context);
    return serializeHighlightRuleOverrides(migrateLegacyTemplateRuleOverrideKeys(parsed, templates));
  },
};

export const supermodHighlightRuleGqlMutations = {
  async setSupermodHighlightRuleOverrides(_root: void, { overrides }: { overrides: unknown }, context: ResolverContext) {
    if (!userIsAdminOrMod(context.currentUser)) {
      throw new Error("You must be a moderator to edit the supermod highlight rules");
    }

    const validated: HighlightRuleOverrides = parseHighlightRuleOverrides(overrides);
    const templates = await getModerationTemplateReferences(context);
    const migrated = migrateLegacyTemplateRuleOverrideKeys(validated, templates);
    const serialized = serializeHighlightRuleOverrides(migrated);
    await context.repos.databaseMetadata.upsertByName(HIGHLIGHT_RULE_OVERRIDES_METADATA_NAME, serialized);
    return serialized;
  },
};
