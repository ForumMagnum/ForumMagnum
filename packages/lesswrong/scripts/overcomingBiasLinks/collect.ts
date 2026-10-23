import { writeFile } from "node:fs/promises";
import { collectLinkDocuments } from "@/scripts/contentLinkRepair/repair";
import { obLinkRepair } from "./content";

/** Read-only. Exported for yarn repl; see README.md in this directory. */
export async function collectOvercomingBiasLinks(outputPath: string) {
  const inventory = await collectLinkDocuments(obLinkRepair(), "%overcomingbias.com%");
  await writeFile(outputPath, JSON.stringify(inventory, null, 2));
  return { urls: inventory.urls.length, documents: inventory.documents.length, errors: inventory.errors.length };
}
