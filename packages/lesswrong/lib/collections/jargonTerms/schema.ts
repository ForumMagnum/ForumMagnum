import { schemaDefaultValue } from '../../utils/schemaUtils';

const schema: SchemaType<"JargonTerms"> = {
  postId: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
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
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    optional: false,
    nullable: false,
  },
  forLaTeX: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    nullable: false,
    ...schemaDefaultValue(false),
  },
  rejected: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    nullable: false,
    ...schemaDefaultValue(false),
  }
};

export default schema;
