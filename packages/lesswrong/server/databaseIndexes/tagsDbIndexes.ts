import { DatabaseIndexSet } from "../../lib/utils/databaseIndexSet";

export function getDbIndexesOnTags() {
  const indexSet = new DatabaseIndexSet();

  indexSet.addIndex("Tags", {deleted:1, adminOnly:1});
  indexSet.addIndex("Tags", {deleted:1, adminOnly:1, name: 1});
  indexSet.addIndex("Tags", {deleted: 1, userId: 1, createdAt: 1});
  indexSet.addIndex("Tags", {deleted:1, adminOnly:1, wikiOnly: 1, createdAt: 1});
  indexSet.addIndex("Tags", {deleted:1, adminOnly:1, wikiGrade: 1, defaultOrder: 1, postCount: 1, name: 1});
  indexSet.addIndex("Tags", {deleted: 1, slug:1, oldSlugs: 1});
  indexSet.addIndex("Tags", {deleted: 1, core:1, name: 1});
  indexSet.addIndex("Tags", {deleted: 1, isPostType:1, name: 1});
  indexSet.addIndex("Tags", {deleted: 1, createdAt: 1});
  indexSet.addIndex("Tags", {deleted: 1, needsReview: 1, createdAt: 1});
  indexSet.addIndex("Tags", {deleted: 1, adminOnly: 1, suggestedAsFilter: 1, defaultOrder: 1, name: 1});
  indexSet.addIndex("Tags", {deleted: 1, adminOnly: 1, lesswrongWikiImportSlug: 1});
  indexSet.addIndex("Tags", {deleted: 1, adminOnly: 1, tagFlagsIds: 1});
  indexSet.addIndex("Tags", {name: 1});
  
  // TODO: switch this to a custom index, maybe a GIN index?
  indexSet.addIndex("Tags", {name: 1, "legacyData.arbitalPageId": 1});
  
  void indexSet.addCustomPgIndex(`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_pingbacks ON "Tags" USING gin(pingbacks);`);
  
  // Used in subTags resolver
  indexSet.addIndex("Tags", {parentTagId: 1});

  return indexSet;
}
