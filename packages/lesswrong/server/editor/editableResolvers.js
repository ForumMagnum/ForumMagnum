import { addFieldsDict, accessFilterMultiple } from '../../lib/modules/utils/schemaUtils.js';
import { Utils } from 'meteor/vulcan:core'
import { RevisionStorageType } from '../../lib/editor/make_editable';
import { loadRevision } from '../revisionsCache.ts';

function checkAndPopulateRevision({ revision, currentUser, Revisions })
{
  if (!revision)
    return null;
  if (!Revisions.checkAccess(currentUser, revision))
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
  }
}

export function addEditableResolvers({collection, options={}}) {
  const {
    fieldName = "",
  } = options;
  
  addFieldsDict(collection, {
    [fieldName || "contents"]: {
      type: RevisionStorageType,
      resolveAs: {
        type: 'Revision',
        arguments: 'version: String',
        resolver: (doc, { version }, { currentUser, Revisions }) => {
          const field = fieldName || "contents"
          if (version) {
            return new Promise((resolve, reject) => {
              Revisions.findOne({documentId: doc._id, version, fieldName: field})
                .then(revision => {
                  resolve(checkAndPopulateRevision({ revision, Revisions, currentUser }));
                });
            });
            //const revision = await Revisions.findOne({documentId: doc._id, version, fieldName: field})
            //return checkAndPopulateRevision({ revision, Revisions, currentUser });
          } else {
            const revisionID = doc[`${field}_latest`];
            if (!revisionID)
              return null;
            
            return new Promise((resolve, reject) => {
              loadRevision({loader: Revisions.loader, id: revisionID})
                .then(revision => {
                  resolve(checkAndPopulateRevision({ revision, Revisions, currentUser }));
                })
            })
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
