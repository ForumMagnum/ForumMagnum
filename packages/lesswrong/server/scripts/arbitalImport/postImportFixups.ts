/* eslint-disable no-console */

import Tags from "@/lib/collections/tags/collection"
import Revisions from "@/lib/collections/revisions/collection"
import { connectAndLoadArbitalDatabase } from "./arbitalImport";
import { MultiDocuments } from "@/lib/collections/multiDocuments/collection";
import { runSqlQuery } from "@/server/sql/sqlClient";
import keyBy from "lodash/keyBy";
import reverse from "lodash/reverse";

// Exported to allow running manually with "yarn repl"
export const removeUnapprovedEdits = async (mysqlConnectionString: string) => {
  const database = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  const revisionIdsToDelete: string[] = [];
  const importedTags = await Tags.find({
    deleted: false,
    "legacyData.arbitalPageId": {$exists: true},
  }).fetch();
  const importedMultiDocuments = await MultiDocuments.find({
    fieldName: "description",
    deleted: false,
    "legacyData.arbitalPageId": {$exists: true}
  }).fetch();

  for (const tag of importedTags) {
    const pageId = tag.legacyData.arbitalPageId;
    const pageInfo = database.pageInfos.find(pi => pi.pageId === pageId);
    if (!pageInfo) continue;
    if (pageInfo.currentEdit === pageInfo.maxEdit) continue;
    
    const arbRevsOfTag = database.pages.filter(p => p.pageId === pageId)
    const arbRevisionsByEdit = keyBy(arbRevsOfTag, p=>p.edit);
    const includedEditsNewestFirst: number[] = [];
    for (let pos=pageInfo.currentEdit; pos>0; ) {
      includedEditsNewestFirst.push(pos);
      pos = arbRevisionsByEdit[pos].prevEdit;
    }
    const includedEditsOldestFirst = reverse(includedEditsNewestFirst);
    const excludedEdits = arbRevsOfTag.filter(r => !includedEditsOldestFirst.includes(r.edit)).map(r => r.edit)
    if (!excludedEdits.length) continue;
    
    const excessRevisions = await runSqlQuery(`
      SELECT *
      FROM "Revisions"
      WHERE
        "documentId"=$1 AND
        ("legacyData"->>'arbitalEditNumber')::INTEGER IN (${excludedEdits.join(",")})
    `, [
      tag._id
    ]);
    if (excessRevisions.length > 0) {
      console.log(`Page ${tag.name} (${pageInfo.pageId}, ${tag._id}) has ${excessRevisions.length} excess revisions (${excessRevisions.map(r => r.legacyData?.arbitalEditNumber).join(",")})`);
      revisionIdsToDelete.push(...excessRevisions.map(r=>r._id));
    }
  }
  
  for (const lens of importedMultiDocuments) {
    const pageId = lens.legacyData.arbitalPageId;
    const pageInfo = database.pageInfos.find(pi => pi.pageId === pageId);
    if (!pageInfo) continue;
    if (pageInfo.currentEdit === pageInfo.maxEdit) continue;
    
    const arbRevsOfLens = database.pages.filter(p => p.pageId === pageId)
    const arbRevisionsByEdit = keyBy(arbRevsOfLens, p=>p.edit);
    const includedEditsNewestFirst: number[] = [];
    for (let pos=pageInfo.currentEdit; pos>0; ) {
      includedEditsNewestFirst.push(pos);
      pos = arbRevisionsByEdit[pos].prevEdit;
    }
    const includedEditsOldestFirst = reverse(includedEditsNewestFirst);
    const excludedEdits = arbRevsOfLens.filter(r => !includedEditsOldestFirst.includes(r.edit)).map(r => r.edit)
    if (!excludedEdits.length) continue;
    
    const excessRevisions = await runSqlQuery(`
      SELECT *
      FROM "Revisions"
      WHERE
        "documentId"=$1 AND
        ("legacyData"->>'arbitalEditNumber')::INTEGER IN (${excludedEdits.join(",")})
    `, [
      lens._id
    ]);
    if (excessRevisions.length > 0) {
      console.log(`Lens ${lens.title} (${pageInfo.pageId}, ${lens._id}) has ${excessRevisions.length} excess revisions (${excessRevisions.map(r => r.legacyData?.arbitalEditNumber).join(",")})`);
      revisionIdsToDelete.push(...excessRevisions.map(r=>r._id));
    }
  }
  
  console.log(revisionIdsToDelete);
  await Revisions.rawRemove({
    _id: {$in: revisionIdsToDelete}
  });
  
}

