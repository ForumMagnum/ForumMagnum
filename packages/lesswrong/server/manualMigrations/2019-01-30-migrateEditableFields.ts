import { registerMigration, migrateDocuments } from './migrationUtils';
import { editableCollections, editableCollectionsFields } from '../../lib/editor/make_editable'
import { getCollection } from '../../lib/vulcan-lib';
import { Revisions } from '../../lib/collections/revisions/collection';

function determineCanonicalContent({ content: draftJS, lastEditedAs, body: markdown, htmlBody: html }: {
  content: any,
  lastEditedAs?: any,
  body: any,
  htmlBody: any,
}) {
  if (lastEditedAs) {
    switch(lastEditedAs) {
      case ("draft-js"): {
        return {type: "draftJS", data: draftJS }
      }
      case ("markdown"): {
        return {type: "markdown", data: markdown || ""}
      }
      default: {
        return {type: "html", data: html || ""}
      }
    }
  }
  if (draftJS && draftJS.blocks) {
    return {type: "draftJS", data: draftJS}
  }
  if (html) {
    return {type: "html", data: html}
  }
  return null
}

function determineSemVer({draft}: {draft: boolean}) {
  return draft ? "0.1.0" : "1.0.0"
}

const TARGET_SCHEMA_VERSION = 2

registerMigration({
  name: "migrateEditableFields",
  dateWritten: "2019-01-30",
  idempotent: true,
  action: async () => {
    for (let collectionName of editableCollections) {
      const collection = getCollection(collectionName)
      await migrateDocuments({
        description: `Migrate ${collectionName} to new content fields`,
        collection,
        batchSize: 1000,
        unmigratedDocumentQuery: {
          schemaVersion: {$lt: TARGET_SCHEMA_VERSION}
        }, 
        migrate: async (documents: Array<any>) => {
          let collectionUpdates: Array<any> = []
          let newRevisions: Array<any> = []
          documents.forEach(doc => {
            editableCollectionsFields[collectionName]!.forEach((fieldName) => {
              let contentFields
              let newFieldName
              if (["Sequences", "Books", "Chapters", "Collections"].includes(collectionName)) { // Special case for sequences, books, collections and chapters
                const canonicalContents = determineCanonicalContent({
                  content: doc.description,
                  body: doc.plaintextDescription,
                  htmlBody: doc.htmlDescription
                })
                if (canonicalContents) {
                  contentFields = {
                    originalContents: canonicalContents,
                    html: doc.htmlDescription,
                    version: determineSemVer(doc),
                    userId: doc.userId,
                    editedAt: doc.postedAt || doc.createdAt
                  }
                  newFieldName = "contents"
                }
              } else if (fieldName === "contents") {
                const canonicalContents = determineCanonicalContent(doc)
                if (canonicalContents) {
                  contentFields = {
                    originalContents: determineCanonicalContent(doc),
                    html: doc.htmlBody,
                    version: determineSemVer(doc),
                    userId: doc.userId,
                    editedAt: doc.postedAt || doc.createdAt,
                    // Special case for comments: Add the `postVersion` field.
                  }
                  newFieldName = "contents"
                }
              } else {
                const canonicalContents = determineCanonicalContent({
                  content: doc[`${fieldName}Content`], 
                  lastEditedAs: doc[`${fieldName}LastEditedAs`], 
                  body: doc[`${fieldName}Body`],
                  htmlBody: doc[`${fieldName}HtmlBody`]
                })
                if (canonicalContents) {
                  contentFields = {
                    originalContents: canonicalContents,
                    html: doc[`${fieldName}HtmlBody`],
                    version: determineSemVer(doc),
                    userId: doc.userId,
                    editedAt: doc.postedAt
                  }
                  newFieldName = fieldName
                } 
              }
              if (contentFields && newFieldName) {
                collectionUpdates.push({
                  updateOne: {
                    filter: {_id: doc._id},
                    update: {
                      $set: {
                        [newFieldName]: contentFields,
                        schemaVersion: TARGET_SCHEMA_VERSION,
                        postVersion: (collectionName === "Comments") ? "1.0.0" : undefined 
                      }
                    }
                  }
                })
                newRevisions.push({
                  insertOne: {
                    document: {
                      ...contentFields,
                      documentId: doc._id,
                      fieldName: newFieldName,
                      schemaVersion: TARGET_SCHEMA_VERSION
                    }
                  }
                })
              } else {
                collectionUpdates.push({
                  updateOne: {
                    filter: {_id: doc._id},
                    update: {$set: {schemaVersion: TARGET_SCHEMA_VERSION}}
                  }
                })
              }
            })
          })
          if (collectionUpdates.length) {
            await collection.rawCollection().bulkWrite(
              collectionUpdates, 
              { ordered: false }
            )
          }
          if (newRevisions.length) {
            await Revisions.rawCollection().bulkWrite(
              newRevisions,
              { ordered: false }
            ) 
          }
        }
      })  
    }
  },
});
