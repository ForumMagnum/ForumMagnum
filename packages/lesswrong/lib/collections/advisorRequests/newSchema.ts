// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle, getFillIfMissing, throwIfSetToNull } from "../../utils/schemaUtils";
import { userOwns } from "../../vulcan-users/permissions";
import SimpleSchema from "simpl-schema";

export interface JobAdsType {
  state: "seen" | "expanded" | "interested" | "uninterested";
  uninterestedReason?: string;
  lastUpdated: Date;
}
const jobAdsType = new SimpleSchema({
  state: {
    type: String,
    allowedValues: ["seen", "expanded", "interested", "uninterested"],
  },
  uninterestedReason: {
    type: String,
    optional: true,
    nullable: true,
  },
  lastUpdated: {
    type: Date,
    optional: true,
  },
});

const schema: Record<string, NewCollectionFieldSpecification<"AdvisorRequests">> = {
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
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
    },
  },
  user: {
    graphql: {
      type: "User",
      canRead: [userOwns, "admins"],
      resolver: generateIdResolverSingle({ collectionName: "AdvisorRequests", fieldName: "userId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  interestedInMetaculus: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing(false),
      onUpdate: throwIfSetToNull,
    },
  },
  jobAds: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      type: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      validation: {
        simpleSchema: FILL_THIS_IN,
      },
    },
  },
};

export default schema;
