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
    if (data.vote[key] !== null && data.vote[key] < 0) {
      throw new Error("Invalid vote value: allocation cannot be negative");
    }
  }
  return data.vote;
};

const validateCompareState = ({data}: {data: Partial<DbElectionVote>}) => {
  return data.compareState;
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
   * Object of type CompareState (from ./helpers.ts), docstring copied from there:
   * ```
   * /* Each entry maps an *ordered pair* of candidate ids concatenated together (e.g. "ADoKFRmPkWbmyWwGw-cF8iwCmwFjbmCqYkQ") to
   *  *the relative value of the candidates. If AtoB is true, then this means the first candidate is `multiplier` times as
   *  *\/ valuable as the second candidate (and vice versa if AtoB is false).
   * export type CompareState = Record<string, {multiplier: number | string, AtoB: boolean}>;
   * ```
   *
   * This is used to calculate an initial vote allocation (via convertCompareStateToVote) on the frontend. This
   * vote allocation can then be edited manually so there is no guarantee that the vote object will be consistent
   * with the compareState object.
   */
  compareState: {
    type: Object,
    blackbox: true,
    optional: true,
    nullable: true,
    canRead: [userOwns, "sunshineRegiment", "admins"],
    canCreate: ["members"],
    canUpdate: [userOwns, "sunshineRegiment", "admins"],
    onCreate: ({ newDocument }) => validateCompareState({ data: newDocument }),
    onUpdate: ({ data }) => {
      // Throw errors but don't return anything
      validateCompareState({ data });
    },
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
