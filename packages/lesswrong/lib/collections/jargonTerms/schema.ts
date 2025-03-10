import { editableFields } from '@/lib/editor/make_editable';
import { foreignKeyField, schemaDefaultValue } from '../../utils/schemaUtils';
import { universalFields } from '../../collectionUtils';

const schema: SchemaType<"JargonTerms"> = {
  ...universalFields({}),
  ...editableFields("JargonTerms", {
    commentEditor: true,
    commentStyles: true,
    hideControls: true,
    order: 10,
    hintText: 'If you want to add a custom term, use this form.  The description goes here.  The term, as well as any alt terms, must appear in your post.',
    permissions: {
      canRead: ['guests'],
      canUpdate: ['members'],
      canCreate: ['members'],
    }
  }),
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
