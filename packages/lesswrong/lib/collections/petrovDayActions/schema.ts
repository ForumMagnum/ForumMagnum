import { userOwns } from "@/lib/vulcan-users/permissions";

const schema: SchemaType<"PetrovDayActions"> = {
  // NOTE: this whole schema is bad, sorry Robert
  actionType: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['members']
  },
  data: {
    type: Object,
    nullable: true,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members']
  },
  userId: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members']
  }
}

export default schema;
