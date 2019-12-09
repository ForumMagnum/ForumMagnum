import { addFieldsDict, accessFilterMultiple } from '../../lib/modules/utils/schemaUtils.js';
import { Utils } from 'meteor/vulcan:core'
import { RevisionStorageType } from '../../lib/editor/make_editable';

export function addEditableResolver({collection, options={}}) {
  const {
    fieldName = "contents",
  } = options;
  
  addFieldsDict(collection, {
    [fieldName || "contents"]: {
      type: RevisionStorageType,
      resolveAs: {
        type: 'Revision',
        arguments: 'version: String',
        resolver: async (doc, { version }, { currentUser, Revisions }) => {
          const field = fieldName || "contents"
          const { checkAccess } = Revisions
          if (version) {
            const revision = await Revisions.findOne({documentId: doc._id, version, fieldName: field})
            return checkAccess(currentUser, revision) ? revision : null
          }
          return {
            editedAt: (doc[field]?.editedAt) || new Date(),
            userId: doc[field]?.userId,
            originalContentsType: (doc[field]?.originalContentsType) || "html",
            originalContents: (doc[field]?.originalContents) || {},
            html: doc[field]?.html,
            updateType: doc[field]?.updateType,
            version: doc[field]?.version,
            wordCount: doc[field]?.wordCount,
          }
        }
      }
    },
    [Utils.camelCaseify(`${fieldName}Revisions`)]: {
      type: Object,
      resolveAs: {
        type: '[Revision]',
        arguments: 'limit: Int = 5',
        resolver: async (post, { limit }, { currentUser, Revisions }) => {
          const field = fieldName || "contents"
          const resolvedDocs = await Revisions.find({documentId: post._id, fieldName: field}, {sort: {editedAt: -1}, limit}).fetch()
          return accessFilterMultiple(currentUser, Revisions, resolvedDocs);
        }
      }
    },
    [Utils.camelCaseify(`${fieldName}Version`)]: {
      type: String,
      resolveAs: {
        type: 'String',
        resolver: (post) => {
          return post[fieldName || "contents"]?.version
        }
      }
    },
  });
}
