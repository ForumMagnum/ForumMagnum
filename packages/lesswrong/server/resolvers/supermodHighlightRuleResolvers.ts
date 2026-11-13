import gql from "graphql-tag";
import fs from "fs/promises";
import path from "path";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { isDevelopment } from "@/lib/executionEnvironment";
import { HIGHLIGHT_RULES_FILE_PATH } from "@/lib/moderatorHighlights/highlightRules";
import {
  parseHighlightRuleOverrides,
  serializeHighlightRuleOverrides,
  type HighlightRuleOverrides,
} from "@/lib/moderatorHighlights/highlightRuleTypes";

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
    // Deployed servers can't change the repo; the rules ship with the code.
    if (!isDevelopment) {
      throw new Error(`Highlight rules can only be saved from a local dev server. Copy the JSON into ${HIGHLIGHT_RULES_FILE_PATH} and commit it instead.`);
    }

    const validated: HighlightRuleOverrides = parseHighlightRuleOverrides(overrides);
    const serialized = serializeHighlightRuleOverrides(validated);
    await fs.writeFile(path.join(process.cwd(), HIGHLIGHT_RULES_FILE_PATH), JSON.stringify(serialized, null, 2) + "\n");
    return serialized;
  },
};
