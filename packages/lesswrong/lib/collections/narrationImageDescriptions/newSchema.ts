import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  /** The image's `src` as it appears in the document; see server/narration/imageDescriptions.ts for which URLs are described */
  imageUrl: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  promptVersion: {
    database: {
      type: "INTEGER",
      nullable: false,
    },
  },
  kind: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  /** What a narrator says for the image. Empty if the image is decorative. */
  reading: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"NarrationImageDescriptions">>;

export default schema;
