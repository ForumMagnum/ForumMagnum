import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "../../utils/schemaUtils";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  reviewWinnerArtId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "ReviewWinnerArts",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  reviewWinnerArt: {
    graphql: {
      outputType: "ReviewWinnerArt",
      canRead: ["sunshineRegiment", "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "ReviewWinnerArts", fieldName: "reviewWinnerArtId" }),
    },
  },
  leftXPct: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  leftYPct: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  leftHeightPct: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  leftWidthPct: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  leftFlipped: {
    database: {
      type: "BOOL",
      defaultValue: false,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  middleXPct: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  middleYPct: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  middleHeightPct: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  middleWidthPct: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  middleFlipped: {
    database: {
      type: "BOOL",
      defaultValue: false,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      inputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  rightXPct: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  rightYPct: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  rightHeightPct: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  rightWidthPct: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  rightFlipped: {
    database: {
      type: "BOOL",
      defaultValue: false,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"SplashArtCoordinates">>;

export default schema;
