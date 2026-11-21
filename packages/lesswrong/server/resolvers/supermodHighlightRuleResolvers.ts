import gql from "graphql-tag";
import fs from "fs/promises";
import path from "path";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { isDevelopment } from "@/lib/executionEnvironment";
import { HIGHLIGHT_RULES_FILE_PATH } from "@/lib/moderatorHighlights/highlightRules";
import { formatHighlightRuleOverrides, parseHighlightRuleOverrides } from "@/lib/moderatorHighlights/highlightRuleTypes";

export const supermodHighlightRuleGqlTypeDefs = gql`
  extend type Mutation {
    setSupermodHighlightRuleOverrides(overrides: JSON!): JSON!
  }
`;

export const supermodHighlightRuleGqlMutations = {
  async setSupermodHighlightRuleOverrides(_root: void, { overrides }: { overrides: unknown }, context: ResolverContext) {
    if (!userIsAdminOrMod(context.currentUser)) {
      throw new Error("You must be a moderator to edit the supermod highlight rules");
    }
    if (!isDevelopment) {
      throw new Error(`Highlight rules can only be saved from a local dev server. Copy the JSON into ${HIGHLIGHT_RULES_FILE_PATH} and commit it instead.`);
    }

    const validated = parseHighlightRuleOverrides(overrides);
    await fs.writeFile(path.join(process.cwd(), HIGHLIGHT_RULES_FILE_PATH), formatHighlightRuleOverrides(validated));
    return validated;
  },
};
