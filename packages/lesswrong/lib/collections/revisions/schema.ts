import { foreignKeyField, resolverOnlyField, accessFilterSingle } from '../../utils/schemaUtils'
import SimpleSchema from 'simpl-schema'
import { addGraphQLSchema } from '../../vulcan-lib';
import { userCanReadField, userIsPodcaster, userOwns } from '../../vulcan-users/permissions';
import { SharableDocument, userIsSharedOn } from '../users/helpers';

/**
 * This covers the type of originalContents for all editor types. 
 * (DraftJS uses object type. DraftJs is deprecated but there are still many documents that use it)
 */
export const ContentType = new SimpleSchema({
  type: String,
  data: SimpleSchema.oneOf(
    String,
    {
      type: Object,
      blackbox: true
    }
  )
})

SimpleSchema.extendOptions([ 'inputType' ]);

// Graphql doesn't allow union types that include scalars, which is necessary
// to accurately represent the data field the ContentType simple schema.

// defining a custom scalar seems to allow it to pass through any data type,
// but this doesn't seem much more permissive than ContentType was originally
addGraphQLSchema(`
  scalar ContentTypeData
`)

addGraphQLSchema(`
  type ContentType {
    type: String
    data: ContentTypeData
  }
`)

const isSharable = (document: any) : document is SharableDocument => {
  return "coauthorStatuses" in document || "shareWithUsers" in document || "sharingSettings" in document
}

export const getOriginalContents = (currentUser: DbUser|null, document: DbObject, originalContents: EditableFieldContents["originalContents"]) => {
  const canViewOriginalContents = (user: DbUser|null, doc: DbObject) => isSharable(doc) ? userIsSharedOn(user, doc) : true

  const returnOriginalContents = userCanReadField(
    currentUser,
    // We need `userIsPodcaster` here to make it possible for podcasters to open post edit forms to add/update podcast episode info
    // Without it, `originalContents` may resolve to undefined, which causes issues in revisionResolvers
    { canRead: [userOwns, canViewOriginalContents, userIsPodcaster, 'admins', 'sunshineRegiment'] },
    document
  )

  return returnOriginalContents ? originalContents : null
}

const schema: SchemaType<DbRevision> = {
  documentId: {
    type: String,
    canRead: ['guests'],
  },
  collectionName: {
    type: String,
    optional: true,
    canRead: ['guests'],
    typescriptType: "CollectionNameString",
  },
  fieldName: {
    type: String,
    canRead: ['guests'],
  },
  editedAt: {
    type: Date,
    optional: true,
    canRead: ['guests'],
  },
  
  // autosaveTimeoutStart: If this revision was created by rate-limited
  // autosaving, this is the timestamp that the rate limit is computed relative
  // to. This is separate from editedAt, which is when this revision was last
  // rewritten. This is so that if the revision is repeatedly updated in place,
  // chaining together edits can't produce an interval longer than the
  // intended one.
  //
  // Optional, only present on revisions that have been autosaved in-place at
  // least once.
  //
  // See also: saveOrUpdateDocumentRevision in ckEditorWebhook.ts
  autosaveTimeoutStart: {
    type: Date,
    optional: true,
  },
  
  updateType: {
    canRead: ['guests'],
    canUpdate: ['members'],
    type: String,
    allowedValues: ['initial', 'patch', 'minor', 'major'],
    optional: true
  },
  version: {
    type: String,
    optional: true,
    canRead: ['guests']
  },
  commitMessage: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['members']
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true
    }),
    canRead: ['guests'],
    optional: true,
  },
  
  // Whether this revision is a draft (ie unpublished). This is here so that
  // after a post is published, we have a sensible way for users to save edits
  // that they don't want to publish just yet. Note that this is redundant with
  // posts' draft field, and does *not* have to be in sync; the latest revision
  // can be a draft even though the document is published (ie, there's a saved
  // but unpublished edit), and the latest revision can be not-a-draft even
  // though the document itself is marked as a draft (eg, if the post was moved
  // back to drafts after it was published).
  //
  // This field will not normally be edited after insertion.
  //
  // The draftiness of a revision used to be implicit in the version number,
  // with 0.x meaning draft and 1.x meaning non-draft, except for tags/wiki
  // where 0.x means imported from the old wiki instead.
  draft: {
    type: Boolean,
    hidden: true,
    optional: true,
    canRead: ['guests'],
  },
  originalContents: {
    type: ContentType,
    canRead: ['guests'],
    resolveAs: {
      type: 'ContentType',
      resolver: async (document: DbRevision, args: void, context: ResolverContext): Promise<DbRevision["originalContents"]|null> => {
        // Original contents sometimes contains private data (ckEditor suggestions 
        // via Track Changes plugin). In those cases the html field strips out the 
        // suggestion. Original contents is only visible to people who are invited 
        // to collaborative editing. (This is only relevant for posts, but supporting
        // it means we need originalContents to default to unviewable)
        if (document.collectionName === "Posts") {
          const post = await context.loaders["Posts"].load(document.documentId)
          return getOriginalContents(context.currentUser, post, document.originalContents)
        }
        return document.originalContents
      }
    }
  },
  html: {
    type: String,
    optional: true,
    canRead: ['guests'],
  },
  markdown: {
    type: String,
    canRead: ['guests'],
    hasServerSide: true, // resolveAs defined in revisionResolvers.ts
  },
  draftJS: {
    type: Object,
    canRead: ['guests'],
    hasServerSide: true, // resolveAs defined in revisionResolvers.ts
  },
  ckEditorMarkup: {
    type: String,
    canRead: ['guests'],
    hasServerSide: true, // resolveAs defined in revisionResolvers.ts
  },
  wordCount: {
    type: Number,
    canRead: ['guests'],
    optional: true,
    denormalized: true,
  },
  htmlHighlight: {
    type: String, 
    canRead: ['guests'],
    hasServerSide: true, // resolveAs defined in revisionResolvers.ts
  },
  htmlHighlightStartingAtHash: {
    type: String, 
    canRead: ['guests'],
    hasServerSide: true, // resolveAs defined in revisionResolvers.ts
  },
  plaintextDescription: {
    type: String, 
    canRead: ['guests'],
    hasServerSide: true, // resolveAs defined in revisionResolvers.ts
  },
  plaintextMainText: {
    type: String,
    canRead: ['guests'],
    hasServerSide: true, // resolveAs defined in revisionResolvers.ts
  },
  changeMetrics: {
    type: Object,
    blackbox: true,
    canRead: ['guests']
  },
  
  tag: resolverOnlyField({
    type: "Tag",
    graphQLtype: "Tag",
    canRead: ['guests'],
    resolver: async (revision: DbRevision, args: void, context: ResolverContext) => {
      const {currentUser, Tags} = context;
      if (revision.collectionName !== "Tags")
        return null;
      const tag = await context.loaders.Tags.load(revision.documentId);
      return await accessFilterSingle(currentUser, Tags, tag, context);
    }
  }),
  post: resolverOnlyField({
    type: "Post",
    graphQLtype: "Post",
    canRead: ['guests'],
    resolver: async (revision: DbRevision, args: void, context: ResolverContext) => {
      const {currentUser, Posts} = context;
      if (revision.collectionName !== "Posts")
        return null;
      const post = await context.loaders.Posts.load(revision.documentId);
      return await accessFilterSingle(currentUser, Posts, post, context);
    }
  }),
};

export default schema;
