import { foreignKeyField, schemaDefaultValue } from '../../utils/schemaUtils';

const schema: SchemaType<"JargonTerms"> = {
  postId: {
    canRead: ['guests'],
    canCreate: ['members'],
    hidden: true,
    nullable: false,
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: true,
    }),
  },
  term: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    nullable: false,
    order: 20
  },
  humansAndOrAIEdited: {
    type: String,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    allowedValues: ['humans', 'AI', 'humansAndAI'],
    // Implementation in jargonTermResolvers.ts
  },
  approved: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    hidden: true,
    ...schemaDefaultValue(false),
  },
  deleted: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    hidden: true,
    ...schemaDefaultValue(false),
  },
  altTerms: {
    type: Array,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    label: "Alternative Terms",
    order: 30,
    tooltip: "Comma-separated, no spaces",
    ...schemaDefaultValue([]),
  },
  'altTerms.$': {
    type: String,
  },
};

export default schema;
