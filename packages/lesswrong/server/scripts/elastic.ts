import { SearchIndexCollectionName } from "@/lib/search/searchUtil";
import ElasticExporter from "../search/elastic/ElasticExporter";

export function configureIndex(collectionName: SearchIndexCollectionName) {
  return new ElasticExporter().configureIndex(collectionName);
}

export function configureIndexes() {
  return new ElasticExporter().configureIndexes();
}

export function exportCollection(collectionName: SearchIndexCollectionName) {
  return new ElasticExporter().exportCollection(collectionName);
}

export function exportAll() {
  return new ElasticExporter().exportAll();
}

export function deleteIndex(collectionName: SearchIndexCollectionName) {
  return new ElasticExporter().deleteIndex(collectionName);
}

export function deleteIndexByName(indexName: string) {
  return new ElasticExporter().deleteIndexByName(indexName);
}

export function deleteOrphanedIndexes() {
  return new ElasticExporter().deleteOrphanedIndexes();
}

/**
 * Backfill relationship ranking fields from PostgreSQL and install their mappings.
 * Unlike configureIndexes (which copies old ES documents), recreating these two
 * indexes populates coauthors, collected authors, and sequence karma while keeping
 * synonyms and switching each alias atomically. No PostgreSQL migration is needed.
 * This is an explicit operational step, not run automatically. Run against
 * the intended database/search environment via yarn repl before relying on them.
 */
export async function rebuildRelationshipSearchIndexes() {
  const exporter = new ElasticExporter();
  await exporter.recreateIndex("Posts");
  await exporter.recreateIndex("Sequences");
}
