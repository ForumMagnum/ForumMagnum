import { registerMigration, migrateDocuments } from './migrationUtils';
import { editableCollections, editableCollectionsFields } from '../../lib/editor/make_editable'
import { getCollection } from 'meteor/vulcan:core'
import { Revisions } from '../../lib/index';

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
  if (html) {
    return {type: "html", data: html}
  }
  return null
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
          schemaVersion: {$lt: 8}
        }, 
        migrate: async (documents) => {
          let collectionUpdates = []
          let newRevisions = []
          documents.forEach(doc => {
            editableCollectionsFields[collectionName].forEach((fieldName) => {
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
                    editedAt: doc.postedAt || doc.createdAt
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
                        schemaVersion: 8,
                      }
                    }
                  }
                })
                newRevisions.push({
                  insertOne: {
                    document: {
                      ...contentFields,
                      documentId: doc._id,
                      fieldName: [newFieldName],
                      schemaVersion: 8
                    }
                  }
                })
              } else {
                collectionUpdates.push({
                  updateOne: {
                    filter: {_id: doc._id},
                    update: {$set: {schemaVersion: 8}}
                  }
                })
              }
            })
          })
          await collection.rawCollection().bulkWrite(
            collectionUpdates, 
            { ordered: false }
          )
          await Revisions.rawCollection().bulkWrite(
            collectionUpdates,
            { ordered: false }
          )  
        }
      })  
    }
  },
});