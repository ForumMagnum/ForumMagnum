// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle, getFillIfMissing } from "../../utils/schemaUtils";

const schema: Record<string, NewCollectionFieldSpecification<"SplashArtCoordinates">> = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
    },
  },
  schemaVersion: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 1,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(1),
      onUpdate: () => 1,
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      type: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  reviewWinnerArtId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "ReviewWinnerArts",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["sunshineRegiment", "admins"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  reviewWinnerArt: {
    graphql: {
      type: "ReviewWinnerArt!",
      canRead: ["sunshineRegiment", "admins"],
      resolver: generateIdResolverSingle({
        collectionName: "SplashArtCoordinates",
        fieldName: "reviewWinnerArtId",
        nullable: false,
      }),
    },
    form: {
      hidden: true,
    },
  },
  leftXPct: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      type: "Float",
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
      type: "Float",
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
      type: "Float",
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
      type: "Float",
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  middleXPct: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      type: "Float",
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
      type: "Float",
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
      type: "Float",
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
      type: "Float",
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  rightXPct: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      type: "Float",
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
      type: "Float",
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
      type: "Float",
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
      type: "Float",
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
};

export default schema;
