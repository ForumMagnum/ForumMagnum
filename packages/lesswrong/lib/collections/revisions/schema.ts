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
