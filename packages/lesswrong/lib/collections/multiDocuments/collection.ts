import { createCollection } from "@/lib/vulcan-lib";
import { addUniversalFields } from "@/lib/collectionUtils";
import { makeEditable } from "@/lib/editor/make_editable";
import schema from "./schema";
import { ensureIndex } from "@/lib/collectionIndexUtils";

export const MultiDocuments = createCollection({
  collectionName: 'MultiDocuments',
  typeName: 'MultiDocument',
  schema,
});

addUniversalFields({ collection: MultiDocuments });

ensureIndex(MultiDocuments, { parentDocumentId: 1, collectionName: 1 });

makeEditable({
  collection: MultiDocuments,
  options: {
    fieldName: "contents",
    normalized: true,
    revisionsHaveCommitMessages: true,
    getLocalStorageId: (multiDocument: DbMultiDocument, name: string) => {
      const { _id, parentDocumentId, collectionName } = multiDocument;
      return { id: `multiDocument:${collectionName}:${parentDocumentId}:${_id}`, verify: false };
    },
  },
});
