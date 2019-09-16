import { addFieldsDict, accessFilterMultiple } from '../../lib/modules/utils/schemaUtils.js';
import { Utils } from 'meteor/vulcan:core';
import { RevisionStorageType } from '../../lib/editor/make_editable.js';
import { loadRevision } from '../revisionsCache.js';

export function addEditableResolvers ({collection, options = {}}) {
  const {
    fieldName = "contents"
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
          let revision;
          if (version) {
            revision = await Revisions.findOne({documentId: doc._id, version, fieldName: field})
          } else {
            const revisionID = doc[`${field}_latest`];
            if (!revisionID) return null;
            revision = await loadRevision({loader: Revisions.loader, id: revisionID});
          }
          revision = checkAccess(currentUser, revision) ? revision : null
          
          if (!revision)
            return null;
          
          return {
            _id: revision._id,
            editedAt: revision.editedAt || new Date(),
            userId: revision.userId,
            originalContentsType: revision.originalContentsType || "html",
            originalContents: revision.originalContents || {},
            html: revision.html,
            updateType: revision.updateType,
            version: revision.version,
            wordCount: revision.wordCount,
          };
        },
      },
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
      },
    },
    [Utils.camelCaseify(`${fieldName}Version`)]: {
      type: String,
      resolveAs: {
        type: "String",
        
        resolver: async (doc, args, { currentUser, Revisions }) => {
          const revisionID = doc[`${fieldName || "contents"}_latest`];
          if (!revisionID) return null;
          let revision = await Revisions.loader.load(revisionID);
          revision = Revisions.checkAccess(currentUser, revision) ? revision : null
          return revision?.version;
        }
      },
    },
  });
}
