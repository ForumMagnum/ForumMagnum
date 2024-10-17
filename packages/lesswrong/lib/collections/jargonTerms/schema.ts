import { schemaDefaultValue } from '../../utils/schemaUtils';

const schema: SchemaType<"JargonTerms"> = {
  postId: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    nullable: false,
  },
  // TODO: ensure we sanitize `term` for possible routes of being created/edited, including both user input and AI generation
  term: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    nullable: false,
    order: 10
  },
  humansAndOrAIEdited: {
    type: String,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    // Implementation in jargonTermResolvers.ts
  },
  forLaTeX: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    // This is here while we're developing, but it might want to be something the user can change later
    hidden: true,
    ...schemaDefaultValue(false),
  },
  approved: {
    type: Boolean,
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
