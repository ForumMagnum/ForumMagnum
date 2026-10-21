import {
  HIGHLIGHT_RULE_OVERRIDES_METADATA_NAME,
  parseHighlightRuleOverrides,
  serializeHighlightRuleOverrides,
} from '../../lib/moderatorHighlights/highlightRuleTypes';
import { upgradeNonEnglishHighlightRules } from '../moderatorHighlights/upgradeNonEnglishHighlightRules';

export const up = async ({ db }: MigrationContext) => {
  // Migrations run in a transaction; lock against concurrent rule-editor saves.
  const row = await db.oneOrNone<{ value: unknown }>(`
    -- detectNonEnglishHighlight
    SELECT "value" FROM "DatabaseMetadata" WHERE "name" = $(name) FOR UPDATE
  `, { name: HIGHLIGHT_RULE_OVERRIDES_METADATA_NAME });
  if (!row) return;

  const overrides = parseHighlightRuleOverrides(row.value);
  const updated = upgradeNonEnglishHighlightRules(overrides);
  await db.none(`
    -- detectNonEnglishHighlight
    UPDATE "DatabaseMetadata" SET "value" = $(value) WHERE "name" = $(name)
  `, { name: HIGHLIGHT_RULE_OVERRIDES_METADATA_NAME, value: serializeHighlightRuleOverrides(updated) });
};

export const down = async () => {
  // Preserve rules moderators may have edited since this migration ran.
};
