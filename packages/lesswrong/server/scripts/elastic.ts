import { SearchIndexCollectionName } from "@/lib/search/searchUtil";
import ElasticExporter from "../search/elastic/ElasticExporter";
import UsersRepo from "../repos/UsersRepo";

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

export async function rebuildRelationshipSearchIndexes() {
  const exporter = new ElasticExporter();
  await exporter.recreateIndex("Posts");
  await exporter.recreateIndex("Comments");
  await exporter.recreateIndex("Sequences");
}

export async function previewUserSearchAliases(userIds: string[]) {
  const repo = new UsersRepo();
  const count = Number(await repo.countSearchDocuments());
  const users = [];
  for (const userId of userIds) {
    const user = await repo.getSearchDocumentById(userId);
    users.push({objectID: user.objectID, displayName: user.displayName, fullName: user.fullName, slug: user.slug});
  }
  return {count, users};
}

export async function rebuildUserSearchIndex() {
  await new ElasticExporter().recreateIndex("Users");
}
