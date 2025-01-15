import { foreignKeyField, schemaDefaultValue } from "../../utils/schemaUtils";

const schema: SchemaType<"ElectionCandidates"> = {
  /** The name of the election this is a candidate in */
  electionName: {
    type: String,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: false,
    nullable: false,
    control: "select",
    options: () => [
      {
        value: "givingSeason24",
        label: "EA Giving Season 2024",
      },
    ],
  },
  /** The name of this candidate */
  name: {
    type: String,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: false,
    nullable: false,
    control: "MuiTextField",
    label: "Candidate name",
  },
  /** URL for this candidates logo */
  logoSrc: {
    type: String,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: false,
    nullable: false,
    control: "MuiTextField",
    label: "Logo image URL",
  },
  /** Link for this candidate (i.e. to the org's website) */
  href: {
    type: String,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: false,
    nullable: false,
    control: "MuiTextField",
    label: "Candidate website URL",
  },
  /** Link for this candidate's GWWC fundraiser page */
  fundraiserLink: {
    type: String,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: true,
    nullable: true,
    control: "MuiTextField",
    label: "GWWC fundraiser URL",
  },
  /** Link for this candidate's page on GWWC (ex: https://www.givingwhatwecan.org/en-US/charities/helen-keller-international) */
  gwwcLink: {
    type: String,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: true,
    nullable: true,
    control: "MuiTextField",
    label: "GWWC charity link",
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
    control: "MuiTextField",
    label: "GWWC fundraiser ID (\"Parfit slug\")",
  },
  /** Short plaintext description */
  description: {
    type: String,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: false,
    nullable: false,
    control: "MuiTextField",
    label: "Candidate description",
    form: {
      multiLine: true,
      rows: 4,
    },
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
    optional: true,
    nullable: false,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    onCreate: ({currentUser}) => currentUser!._id,
    hidden: true,
  },
  /** Denormalized count of posts referencing this candidate in this election */
  postCount: {
    type: Number,
    canRead: ["guests"],
    optional: true,
    nullable: false,
    hidden: true,
    ...schemaDefaultValue(0),
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
    optional: false,
    nullable: true,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    control: "TagSelect",
    label: "Tag (type to search)",
  },
  /** Whether this is the main fundraiser (that will be distributed among the winning candidates), as opposed to being a particular candidate */
  isElectionFundraiser: {
    type: Boolean,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    ...schemaDefaultValue(false),
    optional: true,
    hidden: true,
  },
  /** The amount of money raised in the fundraiser for this candidate */
  amountRaised: {
    type: Number,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: true,
    nullable: true,
    hidden: true,
  },
  /** The target amount of money to raise in the fundraiser for this candidate */
  targetAmount: {
    type: Number,
    canRead: ["guests"],
    canCreate: ["sunshineRegiment", "admins"],
    canUpdate: ["sunshineRegiment", "admins"],
    optional: true,
    nullable: true,
    hidden: true,
  },
};

export default schema;
