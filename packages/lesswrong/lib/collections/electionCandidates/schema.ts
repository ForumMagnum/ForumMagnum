import { schemaDefaultValue } from "../../collectionUtils";
import { eaGivingSeason23ElectionName } from "../../eaGivingSeason";
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
    control: "select",
    options: () => [
      {
        value: eaGivingSeason23ElectionName,
        label: "EA Giving Season 2023",
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
    label: "GWWC link",
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
    control: "TagSelect",
    label: "Tag",
  },
};

export default schema;
