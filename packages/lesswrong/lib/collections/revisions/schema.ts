import { foreignKeyField, resolverOnlyField, accessFilterSingle } from '../../utils/schemaUtils'
import SimpleSchema from 'simpl-schema'

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

const schema: SchemaType<DbRevision> = {
  documentId: {
    type: String,
    viewableBy: ['guests'],
  },
  collectionName: {
    type: String,
    viewableBy: ['guests'],
    typescriptType: "CollectionNameString",
  },
  fieldName: {
    type: String,
    viewableBy: ['guests'],
  },
  editedAt: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
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
    viewableBy: ['guests'],
    editableBy: ['members'],
    type: String,
    allowedValues: ['initial', 'patch', 'minor', 'major'],
    optional: true
  },
  version: {
    type: String,
    optional: true,
    viewableBy: ['guests']
  },
  commitMessage: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members']
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true
    }),
    viewableBy: ['guests'],
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
    viewableBy: ['guests'],
  },
  originalContents: {
    type: ContentType,
    viewableBy: ['guests'],
    editableBy: ['members']
  },
  html: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
  },
  markdown: {
    type: String,
    viewableBy: ['guests'],
    // resolveAs defined in resolvers.js
  },
  draftJS: {
    type: Object,
    viewableBy: ['guests'],
    // resolveAs defined in resolvers.js
  },
  ckEditorMarkup: {
    type: String,
    viewableBy: ['guests'],
    // resolveAs defined in resolvers.js
  },
  wordCount: {
    type: Number,
    viewableBy: ['guests'],
    // resolveAs defined in resolvers.js
  },
  htmlHighlight: {
    type: String, 
    viewableBy: ['guests'],
    // resolveAs defined in resolvers.js
  },
  htmlHighlightStartingAtHash: {
    type: String, 
    viewableBy: ['guests'],
    // resolveAs defined in resolvers.js
  },
  plaintextDescription: {
    type: String, 
    viewableBy: ['guests'],
    // resolveAs defined in resolvers.js
  },
  plaintextMainText: {
    type: String,
    viewableBy: ['guests']
    // resolveAs defined in resolvers.js
  },
  changeMetrics: {
    type: Object,
    blackbox: true,
    viewableBy: ['guests']
  },
  
  tag: resolverOnlyField({
    type: "Tag",
    graphQLtype: "Tag",
    viewableBy: ['guests'],
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
    viewableBy: ['guests'],
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
