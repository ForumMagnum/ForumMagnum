import { foreignKeyField, resolverOnlyField } from "../../utils/schemaUtils";

export const schema: SchemaType<"ReviewWinners"> = {
  postId: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins']
  },
  reviewWinnerArt: resolverOnlyField({
    type: 'ReviewWinnerArt',
    graphQLtype: 'ReviewWinnerArt',
    canRead: ['guests'],
    resolver: async (reviewWinner: DbReviewWinner, args: void, context: ResolverContext) => {
      const { repos } = context;
      return repos.reviewWinnerArts.getActiveReviewWinnerArt(reviewWinner.postId);
    }
  }),
  competitorCount: resolverOnlyField({
    type: 'Int',
    graphQLtype: 'Int',
    canRead: ['guests'],
    resolver: async (reviewWinner: DbReviewWinner, args: void, context: ResolverContext) => {
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
      const yearCompetitors: {[year: number]: number} = {
        2018: 1744,
        2019: 2147,
        2020: 3015,
        2021: 3246,
        2022: 4488
      };
      return yearCompetitors[reviewWinner.reviewYear];
    }
  }),
  reviewYear: {
    type: Number,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins']
  },
  curatedOrder: {
    type: Number,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins']
  },
  reviewRanking: {
    type: Number,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins']
  },
  isAI: {
    type: Boolean,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins']
  },
}
