import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "../../utils/schemaUtils";
import { MODERATOR_ACTION_TYPES } from "./constants";

/**
 * If the action hasn't ended yet (either no endedAt, or endedAt in the future), it's active.
 */
export const isActionActive = (moderatorAction: Pick<DbModeratorAction, "endedAt">) => {
  return !moderatorAction.endedAt || moderatorAction.endedAt > new Date();
};

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
  },
  type: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "ModeratorActionType!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        allowedValues: Object.keys(MODERATOR_ACTION_TYPES),
      },
    },
  },
  endedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  active: {
    graphql: {
      outputType: "Boolean!",
      canRead: ["guests"],
      resolver: (doc) => isActionActive(doc),
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"ModeratorActions">>;

export default schema;
