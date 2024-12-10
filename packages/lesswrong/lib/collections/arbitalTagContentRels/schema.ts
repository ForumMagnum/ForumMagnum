import { schemaDefaultValue } from '../../utils/schemaUtils';

const schema: SchemaType<'ArbitalTagContentRels'> = {
  parentDocumentId: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['members'],
  },
  childDocumentId: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['members'],
  },
  parentCollectionName: {
    type: String,
    nullable: false,
    allowedValues: ['Tags', 'MultiDocuments'],
    canRead: ['guests'],
    canCreate: ['members'],
  },
  childCollectionName: {
    type: String,
    nullable: false,
    allowedValues: ['Tags', 'MultiDocuments'],
    canRead: ['guests'],
    canCreate: ['members'],
  },
  // From Arbital schema comment
  // Type of the relationship.
  // parent: parentId is a parent of childId
  // tag: parentId is a tag of childId
  // requirement: parentId is a requirement of childId
  // subject: parentId is a subject that childId teaches
  // Easy way to memorize: {parentId} is {childId}'s {type}
  // Other way to memorize: for each of the relationships you can add
  // on the relationship tab of the edit page, the page you're editing
  // is the child.
  type: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['members'],
    allowedValues: [
      'parent-taught-by-child',
      'parent-is-requirement-of-child',
      'parent-is-tag-of-child',
      'parent-is-parent-of-child',
    ],
  },
  level: {
    type: Number,
    canRead: ['guests'],
    canCreate: ['members'],
    optional: true,
  },
  isStrong: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['members'],
    ...schemaDefaultValue(false),
  },
};

export default schema; 
