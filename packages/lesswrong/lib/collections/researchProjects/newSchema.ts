import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { userOwns } from "@/lib/vulcan-users/permissions";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      inputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: { optional: true },
    },
  },
  title: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members"],
    },
  },
  description: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members"],
      validation: { optional: true },
    },
  },
  // New writes are encrypted by the ResearchProjects mutation before storage.
  // Tier 1 (external secrets store, column holds an ARN/path) is still the
  // long-term right answer; for now the "Ref" points to app-encrypted token
  // material rather than a separately managed secret-store entry.
  //
  // canRead is admin-only by design: users got this token from
  // `claude setup-token` and should keep their own copy. We never need to
  // hand it back. canUpdate stays [userOwns, "admins"] so the user can
  // rotate / replace their own token.
  claudeCodeTokenRef: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members"],
      validation: { optional: true },
    },
  },
  // Per-project settings: model defaults, sandbox preferences, etc. Free-form
  // until specific fields earn schema slots.
  settings: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "admins"],
      canUpdate: [userOwns, "admins"],
      canCreate: ["members"],
      validation: { optional: true, blackbox: true },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"ResearchProjects">>;

export default schema;
