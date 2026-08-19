import {
  HIGHLIGHT_RULE_OVERRIDES_METADATA_NAME,
  emptyHighlightRuleOverrides,
  migrateLegacyTemplateRuleOverrideKeys,
  parseHighlightRuleOverrides,
  serializeHighlightRuleOverrides,
  type HighlightRule,
  type HighlightRuleOverrides,
  type HighlightRuleTemplateReference,
} from "../../lib/moderatorHighlights/highlightRuleTypes";
import { randomId } from "../../lib/random";
import highlightRuleSeed from "../moderatorHighlights/highlightRuleSeed.json";

// The seed is keyed by template name; this resolves those to _ids per database.
const keepKnownTemplates = (
  rules: Record<string, HighlightRule>,
  templates: HighlightRuleTemplateReference[],
) => {
  const templateIds = new Set(templates.map(template => template._id));
  const known: Record<string, HighlightRule> = {};
  const unresolved: string[] = [];
  for (const [key, rule] of Object.entries(rules)) {
    if (templateIds.has(key)) known[key] = rule;
    else unresolved.push(key);
  }
  return { known, unresolved };
};

const mergeKeepingExisting = (
  existing: Record<string, HighlightRule>,
  seeded: Record<string, HighlightRule>,
) => ({ ...seeded, ...existing });

export const up = async ({db}: MigrationContext) => {
  const templates: HighlightRuleTemplateReference[] = await db.any(`
    -- 20260819T120000.seedSupermodHighlightRules
    SELECT "_id", "name", "collectionName" FROM "ModerationTemplates"
    WHERE "collectionName" IN ('Messages', 'Rejections')
  `);

  const [row] = await db.any(`
    -- 20260819T120000.seedSupermodHighlightRules
    SELECT "value" FROM "DatabaseMetadata" WHERE "name" = $(name)
  `, { name: HIGHLIGHT_RULE_OVERRIDES_METADATA_NAME });

  let existing: HighlightRuleOverrides = emptyHighlightRuleOverrides();
  if (row?.value) {
    // Throw rather than clobber rules a moderator has already edited.
    existing = migrateLegacyTemplateRuleOverrideKeys(parseHighlightRuleOverrides(row.value), templates);
  }

  const seeded = migrateLegacyTemplateRuleOverrideKeys(parseHighlightRuleOverrides({
    ...highlightRuleSeed,
    actions: {},
  }), templates);

  const messages = keepKnownTemplates(seeded.messageTemplates, templates);
  const rejections = keepKnownTemplates(seeded.rejectionTemplates, templates);
  const unresolved = [...messages.unresolved, ...rejections.unresolved];
  if (unresolved.length) {
    // eslint-disable-next-line no-console
    console.log(`No moderation template matched, so not seeded: ${unresolved.join(", ")}`);
  }

  const merged = serializeHighlightRuleOverrides({
    actions: existing.actions,
    messageTemplates: mergeKeepingExisting(existing.messageTemplates, messages.known),
    rejectionTemplates: mergeKeepingExisting(existing.rejectionTemplates, rejections.known),
  });

  await db.none(`
    -- 20260819T120000.seedSupermodHighlightRules
    INSERT INTO "DatabaseMetadata" ("_id", "name", "value", "schemaVersion", "createdAt")
    VALUES ($(_id), $(name), $(value), 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("name") DO UPDATE SET "value" = $(value)
  `, { _id: randomId(), name: HIGHLIGHT_RULE_OVERRIDES_METADATA_NAME, value: merged });
};

export const down = async ({}: MigrationContext) => {
  // Deliberately a no-op: the row also holds rules moderators have since edited.
};
