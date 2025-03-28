import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "../../utils/schemaUtils";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  updatedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  /** The start of the time window this row is counting over. Currently (2024-01-18) all windows are full UTC days */
  windowStart: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  /** The end of the time window this row is counting over. Currently (2024-01-18) all windows are full UTC days */
  windowEnd: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
  },
  /** The post being viewed */
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: false,
    },
  },
  post: {
    // postId used to be a foreignKeyField, which might be why we have a resolver with no canRead permissions?
    graphql: {
      outputType: "Post!",
      canRead: [],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Posts", fieldName: "postId" }),
    },
  },
  /** The number of views on the post in the given window, including duplicates from the same user */
  viewCount: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
  },
  /**
   * The number of unique (by clientId) views on the post in the given window. Note that this is still
   * only for the given day, so views by the same user on different days will still be double counted
   */
  uniqueViewCount: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"PostViews">>;

export default schema;
