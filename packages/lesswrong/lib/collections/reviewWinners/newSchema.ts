// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { getWithCustomLoader } from "../../loaders";
import { generateIdResolverSingle, getFillIfMissing, getForeignKeySqlResolver, throwIfSetToNull } from "../../utils/schemaUtils";

const schema: Record<string, NewCollectionFieldSpecification<"ReviewWinners">> = {
  _id: {
    database: {
      type: "VARCHAR(27)",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
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
      type: "Float",
      canRead: ["guests"],
      onCreate: getFillIfMissing(1),
      onUpdate: () => 1,
    },
  },
  createdAt: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      type: "Date",
      canRead: ["guests"],
      onCreate: () => new Date(),
    },
  },
  legacyData: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      type: "JSON",
      canRead: ["admins"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: false,
    },
    graphql: {
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  post: {
    graphql: {
      type: "Post!",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ collectionName: "ReviewWinners", fieldName: "postId", nullable: false }),
      sqlResolver: getForeignKeySqlResolver({
        collectionName: "ReviewWinners",
        nullable: false,
        idFieldName: "postId",
      }),
    },
    form: {
      hidden: true,
    },
  },
  reviewWinnerArt: {
    graphql: {
      type: "ReviewWinnerArt",
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
      type: "Int",
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
      */ const yearCompetitors = {
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
      type: "Float",
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
      type: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      onCreate: getFillIfMissing("misc"),
      onUpdate: throwIfSetToNull,
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
      type: "Float",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
  reviewRanking: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      type: "Float",
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
      type: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
  },
};

export default schema;
