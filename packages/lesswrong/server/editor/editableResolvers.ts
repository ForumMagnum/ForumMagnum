import { Utils } from '../../lib/vulcan-lib/utils';
import { RevisionStorageType } from '../../lib/editor/make_editable';
import { accessFilterMultiple, addFieldsDict } from '../../lib/utils/schemaUtils';
import { loadRevision } from '../revisionsCache';

export function addEditableResolvers<T extends DbObject>({collection, options={}}: {
  collection: CollectionBase<T>,
  options?: {
    fieldName?: string
  }
}) {
  const {fieldName} = options;
  
  addFieldsDict(collection, {
    [fieldName || "contents"]: {
      type: RevisionStorageType,
      resolveAs: {
        type: 'Revision',
        arguments: 'version: String',
        resolver: async (doc: T, args: {version: string}, context: ResolverContext): Promise<DbRevision|null> => {
          const { version } = args;
          const { currentUser, Revisions } = context;
          const field = fieldName || "contents"
          if (version) {
            const revision = await Revisions.findOne({documentId: doc._id, version, fieldName: field})
            if (!revision) return null;
            return await Revisions.checkAccess(currentUser, revision, context) ? revision : null
          } else {
            const revision = await loadRevision({collection, doc, fieldName});
            if (!revision) return null;
            //return await Revisions.checkAccess(currentUser, revision, context) ? revision : null;
            return revision;
          }
          // TODO
          /*return {
            editedAt: (doc[field]?.editedAt) || new Date(),
            userId: doc[field]?.userId,
            commitMessage: doc[field]?.commitMessage,
            originalContents: (doc[field]?.originalContents) || {},
            html: doc[field]?.html,
            updateType: doc[field]?.updateType,
            version: doc[field]?.version,
            wordCount: doc[field]?.wordCount,
          } as DbRevision;*/
          //HACK: Pretend that this denormalized field is a DbRevision (even though it's missing an _id and some other fields)
        }
      },
    },
    [Utils.camelCaseify(`${fieldName}Revisions`)]: {
      type: Object,
      resolveAs: {
        type: '[Revision]',
        arguments: 'limit: Int = 5',
        resolver: async (post: T, args: { limit: number }, context: ResolverContext): Promise<Array<DbRevision>> => {
          const { limit } = args;
          const { currentUser, Revisions } = context;
          const field = fieldName || "contents"
          const resolvedDocs = await Revisions.find({documentId: post._id, fieldName: field}, {sort: {editedAt: -1}, limit}).fetch()
          return await accessFilterMultiple(currentUser, Revisions, resolvedDocs, context);
        }
      },
    },
    [Utils.camelCaseify(`${fieldName}Version`)]: {
      type: String,
      resolveAs: {
        type: 'String',
        resolver: async (doc: T, args: void, context: ResolverContext): Promise<string> => {
          const revision = await loadRevision({collection, doc, fieldName});
          return revision?.version || "0.0.0";
        }
      }
    },
  });
}
