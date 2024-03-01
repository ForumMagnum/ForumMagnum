const schema: SchemaType<"LcOrders"> = {
  _id: {
    type: String,
    optional: true,
    canRead: ['guests'],
  },
  userId: {
    type: String,
    optional: true,
    canRead: ['guests'],
  },
  marketId: {
    type: String,
    optional: true,
    canRead: ['guests'],
  },
  direction: {
    type: String,
    optional: true,
    canRead: ['guests'],
  },
  size: {
    type: Number,
    optional: true,
    canRead: ['guests'],
  },
  lastUpdated: {
    type: Date,
    optional: false,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
  },
}

export default schema
