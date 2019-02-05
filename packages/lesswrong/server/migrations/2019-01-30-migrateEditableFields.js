import { registerMigration, migrateDocuments } from './migrationUtils';
import { editableCollections, editableCollectionsFields } from '../../lib/editor/make_editable'
import { getCollection } from 'meteor/vulcan:core'
import { convertFromRaw } from 'draft-js';

function determineCanonicalContent({ content: draftJS, lastEditedAs, body: markdown, htmlBody: html }) {
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
  return {type: "html", data: html || ""}
}

function determineSemVer({draft}) {
  return draft ? "0.1.0" : "1.0.0"
}

registerMigration({
  name: "migrateEditableFields",
  idempotent: true,
  action: async () => {
    for (let collectionName of editableCollections) {
      const collection = getCollection(collectionName)
      await migrateDocuments({
        description: `Migrate ${collectionName} to new content fields`,
        collection,
        batchSize: 1000,
        unmigratedDocumentQuery: {
          schemaVersion: {$lt: 3}
        }, 
        migrate: async (documents) => {
          const updates = documents.map(doc => {
            const newFields = _.object(editableCollectionsFields[collectionName].map((fieldName) => {
              if (["Sequences", "Books", "Chapters", "Collections"].includes(collectionName)) { // Special case for sequences, books, collections and chapters
                return [
                  "contents",
                  {
                    originalContents: determineCanonicalContent({
                      content: doc.description,
                      body: doc.plaintextDescription,
                      htmlBody: doc.htmlDescription
                    }),
                    html: doc.htmlDescription,
                    version: determineSemVer(doc),
                    userId: doc.userId,
                    editedAt: doc.postedAt || doc.createdAt
                  }
                ]
              }
              if (fieldName === "contents") {
                return [
                  "contents",
                  {
                    originalContents: determineCanonicalContent(doc),
                    html: doc.htmlBody,
                    version: determineSemVer(doc),
                    userId: doc.userId,
                    editedAt: doc.postedAt || doc.createdAt
                  }
                ]
              }
              return [
                fieldName,
                {
                  originalContents: determineCanonicalContent({
                    content: doc[`${fieldName}Content`], 
                    lastEditedAs: doc[`${fieldName}LastEditedAs`], 
                    body: doc[`${fieldName}Body`],
                    htmlBody: doc[`${fieldName}HtmlBody`]
                  }),
                  html: doc[`${fieldName}HtmlBody`],
                  version: determineSemVer(doc),
                  userId: doc.userId,
                  editedAt: doc.postedAt
                }
              ]
            }))
            return {
              updateOne: {
                filter: {_id: doc._id},
                update: {
                  $set: {
                    schemaVersion: 3,
                    ...newFields
                  }
                }
              }
            }
          })
          await collection.rawCollection().bulkWrite(
            updates, 
            { ordered: false }
          )  
        }
      })  
    }
  },
});