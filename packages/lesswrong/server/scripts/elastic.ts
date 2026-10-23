import type { OnDropDocument } from "@elastic/elasticsearch/lib/helpers";
import type { BulkUpdateOperation } from "@elastic/elasticsearch/lib/api/types";
import ElasticClient from "../search/elastic/ElasticClient";
import Posts from "../collections/posts/collection";
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

interface PostSearchFlags {
  _id: string;
  question: boolean;
  shortform: boolean;
}

interface PostSearchFlagErrors {
  missing: number;
  failed: number;
}

function postSearchFlagUpdate(post: PostSearchFlags): [{update: BulkUpdateOperation}, {doc: {question: boolean; shortform: boolean}}] {
  return [
    {update: {_index: "posts", _id: post._id}},
    {doc: {question: post.question ?? false, shortform: post.shortform ?? false}},
  ];
}

function countPostSearchFlagError(errors: PostSearchFlagErrors, dropped: OnDropDocument<PostSearchFlags>) {
  if (dropped.status === 404) errors.missing++;
  else errors.failed++;
}

export async function backfillPostSearchFlags() {
  const client = new ElasticClient().getClient();
  const errors: PostSearchFlagErrors = {missing: 0, failed: 0};
  let cursor: string | undefined;
  let processed = 0;
  while (true) {
    const posts = await Posts.find(
      {_id: {$gt: cursor ?? ""}},
      {sort: {_id: 1}, limit: 5000},
      {_id: 1, question: 1, shortform: 1},
    ).fetch();
    if (!posts.length) break;
    const result = await client.helpers.bulk({
      datasource: posts,
      onDocument: postSearchFlagUpdate,
      onDrop: countPostSearchFlagError.bind(null, errors),
    });
    if (errors.failed || result.aborted) throw new Error(`Post flag backfill failed: ${errors.failed} non-404 errors; aborted: ${result.aborted}`);
    processed += posts.length;
    cursor = posts[posts.length - 1]._id;
    // eslint-disable-next-line no-console
    console.log(`Post flags processed: ${processed}; absent from index: ${errors.missing}`);
  }
  await client.indices.refresh({index: "posts"});
  // eslint-disable-next-line no-console
  console.log(`Post flag backfill complete: ${processed} processed; ${errors.missing} absent; ${errors.failed} errors`);
}
