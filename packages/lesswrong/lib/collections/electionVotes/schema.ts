import { foreignKeyField } from "../../utils/schemaUtils";
import { userOwns } from "../../vulcan-users";

const validateVote = ({data}: {data: Partial<DbElectionVote>}) => {
  if (data.vote && typeof data.vote !== 'object') {
    throw new Error("Invalid vote value");
  }
  for (let key in data.vote) {
    if (typeof data.vote[key] !== 'number' && data.vote[key] !== null) {
      throw new Error("Invalid vote value");
    }
  }
  return data.vote;
};

const schema: SchemaType<DbElectionVote> = {
  /** The name of the election */
  electionName: {
    type: String,
    optional: false,
    nullable: false,
    canRead: [userOwns, "sunshineRegiment", "admins"],
    canCreate: ["members"],
    canUpdate: [userOwns, "sunshineRegiment", "admins"],
  },
  /** The user voting */
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: false,
    }),
    canRead: [userOwns, "sunshineRegiment", "admins"],
    canCreate: ["members"],
    canUpdate: [userOwns, "sunshineRegiment", "admins"],
  },
  /**
   * Object like {'cF8iwCmwFjbmCqYkQ': 1, 'cF8iwCmwFjbmCqYkQ': 2} representing the (unnormalised) weights
   * given to each selected candidate. Weights can not be negative, but can be null (these will
   * be ignored).
   */
  vote: {
    type: Object,
    blackbox: true,
    optional: true,
    nullable: true,
    canRead: [userOwns, "sunshineRegiment", "admins"],
    canCreate: ["members"],
    canUpdate: [userOwns, "sunshineRegiment", "admins"],
    onCreate: ({ newDocument }) => validateVote({ data: newDocument }),
    onUpdate: ({ data }) => {
      // Throw errors but don't return anything
      validateVote({ data });
    },
  },
  submittedAt: {
    type: Date,
    optional: true,
    nullable: true,
    canRead: [userOwns, "sunshineRegiment", "admins"],
    canCreate: ["members"],
    canUpdate: [userOwns, "sunshineRegiment", "admins"],
  },
  userExplanation: {
    type: String,
    optional: true,
    nullable: true,
    canRead: [userOwns, "sunshineRegiment", "admins"],
    canCreate: ["members"],
    canUpdate: [userOwns, "sunshineRegiment", "admins"],
  },
  userOtherComments: {
    type: String,
    optional: true,
    nullable: true,
    canRead: [userOwns, "sunshineRegiment", "admins"],
    canCreate: ["members"],
    canUpdate: [userOwns, "sunshineRegiment", "admins"],
  }
};

export default schema;
