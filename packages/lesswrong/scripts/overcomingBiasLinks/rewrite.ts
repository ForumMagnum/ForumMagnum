import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { repairLinkDocuments } from "@/scripts/contentLinkRepair/repair";
import { inventorySchema, lookupResultSchema, normalizeObUrl, obLinkRepair, parseLwUrl } from "./content";

/** Dry-run by default. Only { dryRun: false } writes revisions. */
export async function rewriteOvercomingBiasLinks(
  inventoryPath: string,
  lookupPath: string,
  reportPath: string,
  { dryRun = true }: { dryRun?: boolean } = {},
) {
  if ([resolve(inventoryPath), resolve(lookupPath)].includes(resolve(reportPath))) throw new Error("Report must not overwrite an input");
  const inventory = inventorySchema.parse(JSON.parse(await readFile(inventoryPath, "utf8")));
  const lookups = z.array(lookupResultSchema).parse(JSON.parse(await readFile(lookupPath, "utf8")));
  const replacements = new Map<string, string>();
  const excludeFragmentSources = new Set<string>();
  for (const lookup of lookups) {
    if (lookup.status !== "resolved") continue;
    const target = lookup.target && parseLwUrl(lookup.target);
    if (normalizeObUrl(lookup.source) !== lookup.source || !target || !/^\/posts\/[^/]+\/[^/]+$/.test(target.pathname)) {
      throw new Error(`Invalid resolved mapping: ${lookup.source}`);
    }
    if (replacements.has(lookup.source) && replacements.get(lookup.source) !== target.href) {
      throw new Error(`Conflicting mappings: ${lookup.source}`);
    }
    replacements.set(lookup.source, target.href);
    if (lookup.excludeFragments) excludeFragmentSources.add(lookup.source);
  }
  return repairLinkDocuments(inventory.documents, obLinkRepair(replacements, excludeFragmentSources), reportPath, dryRun);
}
