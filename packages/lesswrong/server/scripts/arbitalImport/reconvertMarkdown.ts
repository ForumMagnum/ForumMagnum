/* eslint-disable no-console */

import Revisions from "@/server/collections/revisions/collection";
import groupBy from "lodash/groupBy";
import { ArbitalImportOptions, buildConversionContext, connectAndLoadArbitalDatabase, defaultArbitalImportOptions } from "./arbitalImport";
import { createAdminContext, createAnonymousContext } from "@/server/vulcan-lib/createContexts";
import { arbitalMarkdownToCkEditorMarkup } from "./markdownService";
import { Comments } from "@/server/collections/comments/collection.ts";
import Tags from "@/server/collections/tags/collection";
import { getRootDocument } from "@/lib/collections/multiDocuments/helpers";
import { MultiDocuments } from "@/server/collections/multiDocuments/collection";
import { getLatestRev } from "@/server/editor/utils";
import pick from "lodash/pick";
import { updateDenormalizedHtmlAttributions, UpdateDenormalizedHtmlAttributionsOptions } from "@/server/tagging/updateDenormalizedHtmlAttributions";
import { updateDenormalizedContributorsList } from "@/server/utils/contributorsUtil";
import { buildRevision } from "@/server/editor/conversionUtils";
import { Users } from "@/server/collections/users/collection";
import { getCollection } from "@/server/collections/allCollections";
import { getEditableFieldInCollection } from "@/lib/editor/make_editable";

export const reconvertArbitalMarkdown  = async (mysqlConnectionString: string, options: ArbitalImportOptions) => {
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
      if (!markdown && markdown !== "") {
        console.error(`Revision ${rev._id} of Arbital page ${rev.legacyData.arbitalPageId} is missing arbitalMarkdown`);
        continue
      }
      
      const newHtml = await arbitalMarkdownToCkEditorMarkup({
        markdown,
        pageId: rev.legacyData.arbitalPageId,
        conversionContext,
      });
      
      const oldHtml = rev.originalContents?.data;

      if (oldHtml !== newHtml) {
        console.log(`Document ${documentId} changed in rev ${rev._id}`);
        
        const user = await Users.findOne({_id: rev.userId});
        if (!user) throw new Error(`Could not find user for rev ${rev._id}`);
        const modifiedRevision = await buildRevision({
          originalContents: {
            type: "ckEditorMarkup",
            data: newHtml,
          },
          currentUser: user,
          context: resolverContext,
        });
        await Revisions.rawUpdateOne(
          {_id: rev._id},
          {$set: {
            html: modifiedRevision.html,
            originalContents: {
              type: "ckEditorMarkup",
              data: newHtml,
            },
          }},
        );
        
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
  
  console.log("Changed comments:");
  console.log(commentIdsChanged.values());
  console.log("Changed tags:");
  console.log(tagIdsChanged.values());
  console.log("Changed multidocuments:");
  console.log(multiDocumentIdsChanged.values());

  for (const commentId of commentIdsChanged.values()) {
    await updateDenormalizedEditable(commentId, "Comments", "contents");
  }
  for (const tagId of tagIdsChanged.values()) {
    await updateDenormalizedEditable(tagId, "Tags", "description");
    await recomputeContributorAnnotations({ documentId: tagId, collectionName: "Tags", fieldName: "description", context: resolverContext });
  }
  for (const multiDocumentId of multiDocumentIdsChanged.values()) {
    await updateDenormalizedEditable(multiDocumentId, "MultiDocuments", "contents");
    await recomputeContributorAnnotations({ documentId: multiDocumentId, collectionName: "MultiDocuments", fieldName: "contents", context: resolverContext });
  }
}


async function updateDenormalizedEditable<N extends CollectionNameString>(documentId: string, collectionName: N, fieldName: string) {
  const collection = getCollection(collectionName);
  const context = createAnonymousContext();
  
  if (!getEditableFieldInCollection(collectionName, fieldName)?.graphql.editableFieldOptions.normalized) {
    const latestRev = await getLatestRev(documentId, fieldName, context);
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

async function recomputeContributorAnnotations(options: Omit<UpdateDenormalizedHtmlAttributionsOptions, 'document'> & { documentId: string }) {
  const { documentId, context, ...rest } = options;
  const collection = context[rest.collectionName] as CollectionBase<'Tags' | 'MultiDocuments'>;
  const document = await collection.findOne({_id: documentId});
  if (!document) throw new Error(`Could not find ${rest.collectionName}[${documentId}]`);

  const updateOptions = {
    ...rest,
    document,
    context,
  } as UpdateDenormalizedHtmlAttributionsOptions;
  
  await updateDenormalizedHtmlAttributions(updateOptions);
  await updateDenormalizedContributorsList(updateOptions);
}
