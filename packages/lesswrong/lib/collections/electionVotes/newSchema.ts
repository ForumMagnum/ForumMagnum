// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { generateIdResolverSingle } from "../../utils/schemaUtils";
import { userOwns } from "../../vulcan-users/permissions";
import { validateCompareState, validateVote } from "./helpers";

const schema = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
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
      outputType: "Float",
      canRead: ["guests"],
      onUpdate: () => 1,
      validation: {
        optional: true,
      },
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
      validation: {
        optional: true,
      },
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  /** The name of the election */
  electionName: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  /** The user voting */
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
    },
  },
  user: {
    graphql: {
      outputType: "User!",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
    },
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
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: ({ newDocument }) =>
        validateCompareState({
          data: newDocument,
        }),
      onUpdate: ({ data }) => {
        // Throw errors but don't return anything
        validateCompareState({
          data,
        });
      },
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  /**
   * Object like {'cF8iwCmwFjbmCqYkQ': 1, 'cF8iwCmwFjbmCqYkQ': 2} representing the (unnormalised) weights
   * given to each selected candidate. Weights can not be negative, but can be null (these will
   * be ignored).
   */
  vote: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onCreate: ({ newDocument }) =>
        validateVote({
          data: newDocument,
        }),
      onUpdate: ({ data }) => {
        // Throw errors but don't return anything
        validateVote({
          data,
        });
      },
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  submittedAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: true,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      onUpdate: ({ oldDocument, newDocument }) => {
        if (oldDocument.submittedAt?.toISOString() !== newDocument.submittedAt?.toISOString()) {
          // To avoid timezone issues, set submittedAt to the server time on edit
          return newDocument.submittedAt ? new Date() : null;
        }
        return oldDocument.submittedAt;
      },
      validation: {
        optional: true,
      },
    },
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
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },
  /**
   * DEPRECATED: Use submissionComments instead
   */
  userExplanation: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  /**
   * DEPRECATED: Use submissionComments instead
   */
  userOtherComments: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: [userOwns, "sunshineRegiment", "admins"],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"ElectionVotes">>;

export default schema;
