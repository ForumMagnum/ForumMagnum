import { DatabaseIndexSet, mergeDatabaseIndexSets } from "../../lib/utils/databaseIndexSet";
import { getDbIndexesOnPosts } from "./postsDbIndexes";
import { getDbIndexesOnRevisions, getMiscDbIndexes } from "./miscDbIndexes";
import { getDbIndexesOnUsers } from "./usersDbIndexes";
import { getDbIndexesOnTags } from "./tagsDbIndexes";
import { getDbIndexesOnComments } from "./commentsDbIndexes";
import { getDbIndexesOnVotes } from "./votesDbIndexes";
import { getAllCollections } from "@/lib/vulcan-lib/getCollection";

export function getAllIndexes(): DatabaseIndexSet {
  const indexSets: DatabaseIndexSet[] = [
    getDbIndexesOnComments(),
    getDbIndexesOnPosts(),
    getDbIndexesOnRevisions(),
    getDbIndexesOnTags(),
    getDbIndexesOnUsers(),
    getDbIndexesOnVotes(),
    getMiscDbIndexes(),
    ...getAllCollections().map((collection) => collection.getIndexes()),
  ];
  return mergeDatabaseIndexSets(indexSets);
}
