/* eslint-disable no-console */

import Revisions from "@/lib/collections/revisions/collection";
import { Globals, getCollection } from "@/lib/vulcan-lib";
import groupBy from "lodash/groupBy";
import { ArbitalImportOptions, buildConversionContext, connectAndLoadArbitalDatabase, defaultArbitalImportOptions } from "./arbitalImport";
import { createAdminContext } from "@/server/vulcan-lib";
import { arbitalMarkdownToCkEditorMarkup } from "./markdownService";
import { Comments } from "@/lib/collections/comments";
import Tags from "@/lib/collections/tags/collection";
import { getRootDocument } from "@/lib/collections/multiDocuments/helpers";
import { MultiDocuments } from "@/lib/collections/multiDocuments/collection";
import { editableCollectionsFieldOptions } from "@/lib/editor/makeEditableOptions";
import { getLatestRev } from "@/server/editor/utils";
import pick from "lodash/pick";
import { updateDenormalizedHtmlAttributions } from "@/server/tagging/updateDenormalizedHtmlAttributions";
import { updateDenormalizedContributorsList } from "@/server/utils/contributorsUtil";

Globals.reconvertArbitalMarkdown  = async (mysqlConnectionString: string, options: ArbitalImportOptions) => {
  const optionsWithDefaults: ArbitalImportOptions = {...defaultArbitalImportOptions, ...options};
  const resolverContext = createAdminContext();
  const arbitalDb = await connectAndLoadArbitalDatabase(mysqlConnectionString);
  const conversionContext = await buildConversionContext(arbitalDb, [], optionsWithDefaults);

  const arbitalRevisions = await Revisions.find({
    "legacyData.arbitalPageId": {$exists: true},
  }).fetch();
  const arbitalRevisionsByDocumentId = groupBy(arbitalRevisions, r=>r.documentId);
  const tagIdsChanged = new Set<string>();
  const multiDocumentIdsChanged = new Set<string>();
  const commentIdsChanged = new Set<string>();
  
  for (const documentId in arbitalRevisionsByDocumentId) {
    const collectionName = arbitalRevisionsByDocumentId[documentId][0].collectionName;
    if (collectionName === "Tags") {
      const tag = await Tags.findOne({_id: documentId});
      if (!tag || tag.deleted) continue;
    } else if (collectionName === "MultiDocuments") {
      const multiDocument = await MultiDocuments.findOne({_id: documentId});
      if (!multiDocument || multiDocument.deleted) continue;
      const root = await getRootDocument(multiDocument, resolverContext);
      if (!root || root.document.deleted) continue;
    } else if (collectionName === "Comments") {
      const comment = await Comments.findOne({_id: documentId});
      if (!comment || comment.deleted) continue;
    } else {
      throw new Error("Impossible");
    }
  
    for (const rev of arbitalRevisionsByDocumentId[documentId]) {
      const markdown = rev.legacyData.arbitalMarkdown;
      if (!markdown) {
        console.error(`Revision ${rev._id} of Arbital page ${rev.legacyData.arbitalPageId} is missing arbitalMarkdown`);
      }
      
      const newHtml = await arbitalMarkdownToCkEditorMarkup({
        markdown,
        pageId: rev.legacyData.arbitalPageId,
        conversionContext,
      });
      
      const oldHtml = rev.originalContents?.data;

      if (oldHtml !== newHtml) {
        console.log(`Document ${documentId} changed in rev ${rev._id}`);
        
        switch (collectionName) {
          case "Tags":
            tagIdsChanged.add(documentId);
            break;
          case "MultiDocuments":
            multiDocumentIdsChanged.add(documentId);
            break;
          case "Comments":
            commentIdsChanged.add(documentId);
            break;
        }
      }
    }
  }
  
  for (const commentId of commentIdsChanged.values()) {
    await updateDenormalizedEditable(commentId, "Comments", "contents");
  }
  for (const tagId of tagIdsChanged.values()) {
    await updateDenormalizedEditable(tagId, "Tags", "description");
    await recomputeContributorAnnotations(tagId, "Tags", "description");
  }
  for (const multiDocumentId of multiDocumentIdsChanged.values()) {
    await updateDenormalizedEditable(multiDocumentId, "MultiDocuments", "description");
    await recomputeContributorAnnotations(multiDocumentId, "MultiDocuments", "contents");
  }
}


async function updateDenormalizedEditable(documentId: string, collectionName: CollectionNameString, fieldName: string) {
  const collection = getCollection(collectionName);
  if (!editableCollectionsFieldOptions[collectionName][fieldName].normalized) {
    const latestRev = await getLatestRev(documentId, fieldName);
    if (!latestRev) throw new Error(`Could not get latest rev for ${collectionName}["${documentId}"].${fieldName}`);
    await collection.rawUpdateOne(
      {_id: documentId},
      {$set: {
        [fieldName]: {
          ...pick(latestRev, [
            "html", "version", "userId", "editedAt", "wordCount",
            "originalContents", "commitMessage", "googleDocMetadata", "updateType"
          ])
        }
      }},
    );
  }
}

async function recomputeContributorAnnotations(documentId: string, collectionName: "MultiDocuments"|"Tags", fieldName: "description"|"contents") {
  const collection = getCollection(collectionName);
  const document = await collection.findOne({_id: documentId});
  if (!document) throw new Error(`Could not find ${collectionName}[${documentId}]`);
  await updateDenormalizedHtmlAttributions({
    document: document,
    collectionName,
    fieldName,
  });
  await updateDenormalizedContributorsList({
    document: document,
    collectionName,
    fieldName,
  });
}
