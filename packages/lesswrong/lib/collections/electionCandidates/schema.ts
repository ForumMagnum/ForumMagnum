import { foreignKeyField } from "../../utils/schemaUtils";

const schema: SchemaType<DbElectionCandidate> = {
  /** The name of the election this is a candidate in */
  electionName: {
    type: String,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: false,
    nullable: false,
  },
  /** The name of this candidate */
  name: {
    type: String,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: false,
    nullable: false,
  },
  /** URL for this candidates logo */
  logoSrc: {
    type: String,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: false,
    nullable: false,
  },
  /** Link for this candidate */
  href: {
    type: String,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: false,
    nullable: false,
  },
  /** Short plaintext description */
  description: {
    type: String,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: false,
    nullable: false,
  },
  /** The user who created this candidate (this is required by makeVoteable) */
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    optional: false,
    nullable: false,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
  },
  /** Denormalized count of posts referencing this candidate in this election */
  postCount: {
    type: Number,
    canRead: ["guests"],
    optional: false,
    nullable: false,
    defaultValue: 0,
  },
  /** The tag user for marking posts as being relevant to this candidate */
  tagId: {
    ...foreignKeyField({
      idFieldName: "tagId",
      resolverName: "tag",
      collectionName: "Tags",
      type: "Tag",
      nullable: true,
    }),
    optional: true,
    nullable: true,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
  },
};

export default schema;
