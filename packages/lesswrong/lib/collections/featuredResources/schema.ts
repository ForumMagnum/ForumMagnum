import { universalFields } from '../../collectionUtils';

const schema: SchemaType<"FeaturedResources"> = {
  ...universalFields({}),
  title: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    control: 'text',
  },
  body: {
    type: String,
    nullable: true, //at request of EA Forum since they had missing values
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    control: 'text',
  },
  ctaText: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    control: 'text',
  },
  ctaUrl: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    control: 'EditUrl'
  },
  expiresAt: {
    type: Date,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    optional: true,
    nullable: true,
    control: 'datetime',
  },
}

export default schema;
