import { universalFields } from '../../collectionUtils';

const schema: SchemaType<"ManifoldProbabilitiesCaches"> = {
  ...universalFields({}),
  marketId: {
    type: String,
    optional: false,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
  },
  probability: {
    type: Number,
    optional: false,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
  },
  isResolved: {
    type: Boolean,
    optional: false,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
  },
  year: {
    type: Number,
    optional: false,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
  },
  lastUpdated: {
    type: Date,
    optional: false,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
  },
  url: {
    type: String,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canCreate: ['admins'],
  }
}

export default schema
