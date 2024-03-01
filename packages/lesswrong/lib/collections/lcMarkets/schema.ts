const schema: SchemaType<"LcMarkets"> = {
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
    minSettlement: {
        type: Number,
        optional: true,
        canRead: ['guests'],
    },
    maxSettlement: {
        type: Number,
        optional: true,
        canRead: ['guests'],
    },
    open: {
        type: Boolean,
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
