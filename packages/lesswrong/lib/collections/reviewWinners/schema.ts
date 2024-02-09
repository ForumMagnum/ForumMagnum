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
      // TODO: correctly calculate competitors
      const yearCompetitors: {[year: number]: number} = {
        2018: 20,
        2019: 20,
        2020: 20,
        2021: 20,
        2022: 20
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
