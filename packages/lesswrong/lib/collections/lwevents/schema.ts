import { accessFilterSingle, foreignKeyField, resolverOnlyField } from '../../utils/schemaUtils'

const schema: SchemaType<DbLWEvent> = {
  createdAt: {
    type: Date,
    optional: true,
    onInsert: (document, currentUser) => new Date(),
    viewableBy: ['members'],
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    viewableBy: ['members'],
    insertableBy: ['members'],
    optional: true,
  },
  name: {
    type: String,
    viewableBy: ['members'],
    insertableBy: ['members'],
  },
  documentId: {
    type: String,
    // No explicit foreign-key relationship because documentId refers to different collections based on event type
    optional: true,
    viewableBy: ['members'],
    insertableBy: ['members'],
  },
  post: resolverOnlyField({
    type: Object,
    viewableBy: ['guests'],
    resolver: async (document: DbLWEvent, args: void, context: ResolverContext) => {
      const { currentUser, Posts } = context;
      const post = await context.loaders.Posts.load(document.documentId);
      return await accessFilterSingle(currentUser, Posts, post, context);
    },
  }),
  important: { // marking an event as important means it should never be erased
    type: Boolean,
    optional: true,
    viewableBy: ['members'],
    insertableBy: ['members'],
    editableBy: ['admins']
  },
  properties: {
    type: Object,
    optional: true,
    blackbox: true,
    viewableBy: ['members'],
    insertableBy: ['members'],
  },
  intercom: { // whether to send this event to intercom or not
    type: Boolean,
    optional: true,
    viewableBy: ['members'],
    insertableBy: ['members'],
  }
};

export default schema;
