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
