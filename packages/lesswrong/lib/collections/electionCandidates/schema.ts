import { schemaDefaultValue } from "../../collectionUtils";
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
  /** Link for this candidate (i.e. to the org's website) */
  href: {
    type: String,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: false,
    nullable: false,
  },
  /** Link for this candidate's GWWC fundraiser page */
  fundraiserLink: {
    type: String,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: true,
    nullable: true,
  },
  /** Link for this candidate's page on GWWC (ex: https://www.givingwhatwecan.org/en-US/charities/helen-keller-international) */
  gwwcLink: {
    type: String,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: true,
    nullable: true,
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
  /** Whether this is the main fundraiser (that will be distributed among the winning candidates), as opposed to being a particular candidate */
  isElectionFundraiser: {
    type: Boolean,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    ...schemaDefaultValue(false),
  },
  /**
   * The id of the fundraiser ("Parfit slug" in gwwc's CMS). This can be different from the slug in the fundraiser link
   * (although they are often the same)
   */
  gwwcId: {
    type: String,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: true,
    nullable: true,
  },
  /** The amount of money raised in the fundraiser for this candidate */
  amountRaised: {
    type: Number,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: true,
    nullable: true,
  },
  /** The target amount of money to raise in the fundraiser for this candidate */
  targetAmount: {
    type: Number,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: true,
    nullable: true,
  },
};

export default schema;
