import { universalFields } from "@/lib/collectionUtils";
import { foreignKeyField } from "../../utils/schemaUtils";
import { userOwns } from "../../vulcan-users/permissions";
import { validateCompareState, validateVote } from "./helpers";

const schema: SchemaType<"ElectionVotes"> = {
  ...universalFields({}),

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
    canRead: ["guests"],
    canCreate: ["members"],
    canUpdate: [userOwns, "sunshineRegiment", "admins"],
    onUpdate: ({ oldDocument, newDocument }) => {
      if (oldDocument.submittedAt?.toISOString() !== newDocument.submittedAt?.toISOString()) {
        // To avoid timezone issues, set submittedAt to the server time on edit
        return newDocument.submittedAt ? new Date() : null;
      }
      return oldDocument.submittedAt;
    }
  },
  /**
   * Json blob storing the answers to the questions in the submission form,
   * along with the exact wording of the questions. See ./helpers:
   * ```
   * export type SubmissionComments = {
   *   rawFormValues: {
   *     electionEffect: string;
   *     note: string;
   *   };
   *   questions: {
   *     question: string;
   *     answer: string;
   *     answerValue?: string;
   *   }[];
   * }
   * ```
   */
  submissionComments: {
    type: Object,
    blackbox: true,
    optional: true,
    nullable: true,
    canRead: [userOwns, "sunshineRegiment", "admins"],
    canCreate: ["members"],
    canUpdate: [userOwns, "sunshineRegiment", "admins"],
  },
  /**
   * DEPRECATED: Use submissionComments instead
   */
  userExplanation: {
    type: String,
    optional: true,
    nullable: true,
    canRead: [userOwns, "sunshineRegiment", "admins"],
    canCreate: ["members"],
    canUpdate: [userOwns, "sunshineRegiment", "admins"],
  },
  /**
   * DEPRECATED: Use submissionComments instead
   */
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
