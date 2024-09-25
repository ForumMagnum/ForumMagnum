
const schema: SchemaType<"PetrovDayActions"> = {
  // NOTE: this whole schema is bad, sorry Robert
  actionType: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
  },
  data: {
    type: Object,
    nullable: true,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
  },
  userId: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
  }
}

export default schema;
