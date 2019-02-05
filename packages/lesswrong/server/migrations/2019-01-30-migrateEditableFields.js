import { registerMigration, migrateDocuments } from './migrationUtils';
import { editableCollections, editableCollectionsFields } from '../../lib/editor/make_editable'
import { getCollection } from 'meteor/vulcan:core'
import { convertFromRaw, convertToRaw } from 'draft-js';

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
  try {
    convertFromRaw(draftJS)
    return {type: "draftJS", data: draftJS}
  } catch(e) {
    return {type: "html", data: html || ""}
  }
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
          schemaVersion: {$lt: 1}
        }, 
        migrate: async (documents) => {
          const updates = documents.map(post => {
            const newFields = _.object(editableCollectionsFields[collectionName].map((fieldName) => {
              if (fieldName === "contents") {
                return [
                  "contents",
                  {
                    originalContents: determineCanonicalContent(post),
                    html: post.htmlBody,
                    version: determineSemVer(post),
                    userId: post.userId,
                    editedAt: post.postedAt
                  }
                ]
              }
              return [
                fieldName,
                {
                  originalContents: determineCanonicalContent({
                    content: post[`${fieldName}Content`], 
                    lastEditedAs: post[`${fieldName}LastEditedAs`], 
                    body: post[`${fieldName}Body`],
                    htmlBody: post[`${fieldName}HtmlBody`]
                  }),
                  html: post[`${fieldName}HtmlBody`],
                  version: determineSemVer(post),
                  userId: post.userId,
                  editedAt: post.postedAt
                }
              ]
            }))
            return {
              updateOne: {
                filter: {_id: post._id},
                update: {
                  $set: {
                    schemaVersion: 1,
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