import { getSqlClientOrThrow } from "@/server/sql/sqlClient";

/** Read-only: list the rejection templates and their current group labels. */
export async function listRejectionTemplates() {
  const db = getSqlClientOrThrow();
  const templates = await db.any(`
    -- groupRejectionTemplates.list
    SELECT _id, name, "groupLabel", "order", deleted
    FROM "ModerationTemplates"
    WHERE "collectionName" = 'Rejections' AND deleted IS NOT TRUE
    ORDER BY "order", name
  `);
  /* eslint-disable-next-line no-console */
  console.log(JSON.stringify(templates, null, 2));
  return templates;
}

/**
 * Grouping for the rejection reasons. Each group answers one question about the
 * submission, and anything that would leave a group under three members stays
 * ungrouped (the sidebar buckets those under "Other"). Names are matched trimmed,
 * since a few templates have trailing spaces. Moderators can re-sort from the
 * sidebar by dragging a template onto another group's header.
 */
const TEMPLATE_GROUPS: Record<string, string[]> = {
  // Written by an LLM
  "LLM": [
    "No LLM",
    "No LLM (autoreject)",
    "Potentially / Partially LLM",
    "LLM (English translation)",
    "LLM sycophancy trap",
  ],
  // AI-safety submissions that don't clear the bar
  "AI Content": [
    "Insufficient Quality for AI Content (posts)",
    "Insufficient Quality for AI Content (comments)",
    "Probably Insufficient Quality for AI Content",
    "Missing some AI alignment basics",
  ],
  // Doesn't meet the epistemic bar
  "Quality": [
    "Insufficient quality",
    "Insufficient first comment quality",
    "Confusion / Muddled Reasoning",
    "Missing some rationality basics",
    "Not addressing relevant prior discussion",
  ],
  // The prose or layout itself
  "Writing & Formatting": [
    "Unclear writing",
    "Unclear focus",
    "Clearer intro",
    "Formatting",
    "Too Chonky Abstract paragraph",
  ],
  // Wrong subject for this site
  "Off-Topic": [
    "Off topic",
    "Somewhat offtopic crosspost",
    "Political norm",
    "Roko's Basilisk",
    "AI Capabilities",
  ],
  // Standing rules against a kind of submission
  "Not Accepted": [
    "No fiction/poetry from new users",
    "No LLM Case Studies",
    "No Unmotivated Vibecoded AI Research",
  ],
  // The moderator can't tell yet
  "Uncertain": [
    "Difficult to evaluate, with potential yellow flags.",
    "Difficult to evaluate (offsite content)",
    "Not obviously not spam",
    "Submitted by Accident?",
  ],
};

/**
 * Deliberately left ungrouped: each would form a group of one or two. Listed so the
 * script can tell "we decided against a group" apart from "a new template appeared".
 */
const UNGROUPED_TEMPLATES = [
  // A two-item language pair
  "Poor English",
  "We only accept English-language content",
  // A two-item conduct pair, plus a boundary-setting reply that isn't quite conduct
  "Unhelpfully aggressive",
  "Gratuitously Offensive",
  "No, we won't answer followup questions",
  // Doesn't belong with anything
  "Duplicate",
];

export async function applyRejectionTemplateGroups({ dryRun = true }: { dryRun?: boolean } = {}) {
  const db = getSqlClientOrThrow();
  /* eslint-disable no-console */

  const templates: { _id: string; name: string; groupLabel: string | null }[] = await db.any(`
    -- groupRejectionTemplates.fetchForGrouping
    SELECT _id, name, "groupLabel"
    FROM "ModerationTemplates"
    WHERE "collectionName" = 'Rejections' AND deleted IS NOT TRUE
  `);

  const groupByName = new Map<string, string | null>();
  for (const [group, names] of Object.entries(TEMPLATE_GROUPS)) {
    for (const name of names) {
      groupByName.set(name, group);
    }
  }
  for (const name of UNGROUPED_TEMPLATES) {
    groupByName.set(name, null);
  }

  const updates: { _id: string; name: string; from: string | null; to: string | null }[] = [];
  const unmatched: string[] = [];
  for (const template of templates) {
    const trimmedName = template.name.trim();
    if (!groupByName.has(trimmedName)) {
      unmatched.push(template.name);
      continue;
    }
    const group = groupByName.get(trimmedName) ?? null;
    if (template.groupLabel !== group) {
      updates.push({ _id: template._id, name: template.name, from: template.groupLabel, to: group });
    }
  }

  const namesInDb = new Set(templates.map(t => t.name.trim()));
  const missingFromDb = [...groupByName.keys()].filter(name => !namesInDb.has(name));

  console.log(`${templates.length} templates, ${updates.length} to update`);
  if (unmatched.length) console.log("NOT IN ANY GROUP:", unmatched);
  if (missingFromDb.length) console.log("GROUPED BUT NOT IN DB:", missingFromDb);
  console.log(JSON.stringify(updates, null, 2));

  if (dryRun) {
    console.log("Dry run — nothing written. Re-run with {dryRun: false} to apply.");
    return { updates, unmatched, missingFromDb };
  }

  for (const update of updates) {
    await db.none(`
      -- groupRejectionTemplates.setGroupLabel
      UPDATE "ModerationTemplates" SET "groupLabel" = $(groupLabel) WHERE _id = $(id)
    `, { groupLabel: update.to, id: update._id });
  }
  console.log(`Applied ${updates.length} group labels.`);
  return { updates, unmatched, missingFromDb };
}

export default listRejectionTemplates;
