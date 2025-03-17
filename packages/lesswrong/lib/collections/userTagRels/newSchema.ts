// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle, getFillIfMissing, throwIfSetToNull } from "@/lib/utils/schemaUtils";
import { userOwns } from "@/lib/vulcan-users/permissions";

const schema: Record<string, NewCollectionFieldSpecification<"UserTagRels">> = {
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
  tagId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Tags",
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canCreate: ["members"],
    },
  },
  tag: {
    graphql: {
      type: "Tag",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "UserTagRels", fieldName: "tagId", nullable: false }),
    },
    form: {
      hidden: true,
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
      canRead: ["guests"],
      canCreate: ["members"],
    },
  },
  user: {
    graphql: {
      type: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "UserTagRels", fieldName: "userId", nullable: false }),
    },
    form: {
      hidden: true,
    },
  },
  subforumLastVisitedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      type: "Date",
    },
  },
  subforumShowUnreadInSidebar: {
    database: {
      type: "BOOL",
      defaultValue: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      type: "Boolean",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members", "admins"],
      onCreate: getFillIfMissing(true),
      onUpdate: throwIfSetToNull,
    },
  },
  subforumEmailNotifications: {
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
    form: {
      label: "Notify me of new discussions",
    },
  },
  subforumHideIntroPost: {
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
};

export default schema;
