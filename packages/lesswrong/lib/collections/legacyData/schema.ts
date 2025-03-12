import { universalFields } from "@/lib/collectionUtils";

const schema: SchemaType<"LegacyData"> = {
  ...universalFields({}),
  objectId: {
    type: String,
    nullable: false,
  },
  collectionName: {
    type: String,
    nullable: false,
  },
};

export default schema;
