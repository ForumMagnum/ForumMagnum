import { universalFields } from "@/lib/collectionUtils";
import { schemaDefaultValue } from "@/lib/utils/schemaUtils";

const schema: SchemaType<"Migrations"> = {
  ...universalFields({}),
  name: {
    type: String,
    nullable: false,
  },
  started: {
    type: Date,
    nullable: false,
  },
  finished: {
    type: Boolean,
    ...schemaDefaultValue(false),
  },
  succeeded: {
    type: Boolean,
    ...schemaDefaultValue(false),
  },
};

export default schema;
