import { schemaDefaultValue } from '../../utils/schemaUtils';

const schema: SchemaType<"JargonTerms"> = {
  postId: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    nullable: false,
  },
  term: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    nullable: false,
  },
  humansAndOrAIEdited: {
    type: String,
    allowedValues: ['humans', 'AI', 'humansAndAI'],
    canRead: ['guests'],
    optional: false,
    nullable: false,
    ...schemaDefaultValue('humans'),
  },
  forLaTeX: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    nullable: false,
    // This is here while we're developing, but it might want to be something the user can change later
    hidden: true,
    ...schemaDefaultValue(false),
  },
  rejected: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    nullable: false,
    hidden: true,
    ...schemaDefaultValue(false),
  },
  deleted: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    nullable: false,
    hidden: true,
    ...schemaDefaultValue(false),
  },
  altTerms: {
    type: Array,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    nullable: false,
    ...schemaDefaultValue([]),
  },
  'altTerms.$': {
    type: String,
  },
};

export default schema;
