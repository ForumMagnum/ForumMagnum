// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { getWithCustomLoader } from "../../loaders";
import { generateIdResolverSingle, getForeignKeySqlResolver } from "../../utils/schemaUtils";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  post: {
    graphql: {
      outputType: "Post!",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Posts", fieldName: "postId" }),
      sqlResolver: getForeignKeySqlResolver({
        collectionName: "ReviewWinners",
        nullable: false,
        idFieldName: "postId",
      }),
    },
  },
  reviewWinnerArt: {
    graphql: {
      outputType: "ReviewWinnerArt",
      canRead: ["guests"],
      resolver: async (reviewWinner, args, context) => {
        return getWithCustomLoader(context, "activeReviewWinnerArt", reviewWinner.postId, (postIds) =>
          context.repos.reviewWinnerArts.getAllActiveReviewWinnerArt(postIds)
        );
      },
    },
  },
  competitorCount: {
    graphql: {
      outputType: "Int",
      canRead: ["guests"],
      resolver: async (reviewWinner, args, context) => {
        /* Calculated via:
        SELECT COUNT(DISTINCT "Posts"."_id")
        FROM "Posts"
        WHERE "postedAt" >= '{YEAR}-01-01'
          AND "postedAt" < '{YEAR+1}-01-01'
          AND "baseScore" > 0
          AND "draft" is false
        AND "Posts"."_id" IN (
            SELECT "Votes"."documentId"
            FROM "Votes"
            GROUP BY "Votes"."documentId"
            HAVING COUNT("Votes"."_id") > 1
        );
        */
        const yearCompetitors: Record<number, number> = {
          2018: 1744,
          2019: 2147,
          2020: 3015,
          2021: 3246,
          2022: 4488,
        };
        return yearCompetitors[reviewWinner.reviewYear];
      },
    },
  },
  reviewYear: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      inputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  category: {
    database: {
      type: "TEXT",
      defaultValue: "misc",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        allowedValues: ["rationality", "modeling", "optimization", "ai strategy", "ai safety", "practical"],
      },
    },
  },
  curatedOrder: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: true,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  reviewRanking: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      inputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  isAI: {
    database: {
      type: "BOOL",
      nullable: true,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"ReviewWinners">>;

export default schema;
