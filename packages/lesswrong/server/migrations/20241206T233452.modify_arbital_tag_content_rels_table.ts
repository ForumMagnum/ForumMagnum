import { ArbitalTagContentRels } from "@/lib/collections/arbitalTagContentRels/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  //add parentCollectionName and childCollectionName to ArbitalTagContentRels
  // also rename parentTagId to parentDocumentId and childTagId to childDocumentId
  await addField(db, ArbitalTagContentRels, 'parentCollectionName');
  await addField(db, ArbitalTagContentRels, 'childCollectionName');
  // handled these manually because types failed once changed
  // await dropField(db, ArbitalTagContentRels, 'parentTagId');
  // await dropField(db, ArbitalTagContentRels, 'childTagId');
  await addField(db, ArbitalTagContentRels, 'parentDocumentId');
  await addField(db, ArbitalTagContentRels, 'childDocumentId');
}

export const down = async ({db}: MigrationContext) => {
}
