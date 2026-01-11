import { DatabaseIndexSet, mergeDatabaseIndexSets } from "../../lib/utils/databaseIndexSet";
import { getDbIndexesOnPosts } from "./postsDbIndexes";
import { getDbIndexesOnUsers } from "./usersDbIndexes";
import { getDbIndexesOnTags } from "./tagsDbIndexes";
import { getDbIndexesOnComments } from "./commentsDbIndexes";
import { getDbIndexesOnVotes } from "./votesDbIndexes";
import { getAllCollections } from "@/server/collections/allCollections";

export function getAllIndexes(): DatabaseIndexSet {
  const indexSets: DatabaseIndexSet[] = [
    getDbIndexesOnComments(),
    getDbIndexesOnPosts(),
    getDbIndexesOnTags(),
    getDbIndexesOnUsers(),
    getDbIndexesOnVotes(),
    ...getAllCollections().map((collection) => collection.getIndexes()),
  ];
  return mergeDatabaseIndexSets(indexSets);
}
