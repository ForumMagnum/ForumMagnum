import { foreignKeyField, resolverOnlyField } from "../../utils/schemaUtils";

export const schema: SchemaType<"ReviewWinners"> = {
  postId: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins']
  },
  splashArtImageUrl: { // I'd like to remove this field, is that okay?
    type: String,
    nullable: true,
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
  // splashArtCoordinate: resolverOnlyField({ // probably do the sorting in javascript?
  //   type: "SplashArtCoordinate",
  //   graphQLtype: "SplashArtCoordinate",
  //   canRead: ['guests'],
  //   resolver: async (reviewWinner: DbReviewWinner, args: void, context: ResolverContext): Promise<DbSplashArtCoordinate|null> => {
  //     const { repos } = context;
  //     return repos.splashArtCoordinates.getActiveSplashArtCoordinates(reviewWinner.postId);
  //   },
  //   // sqlResolver: ({ field, join }) => `
  //   //   SELECT sac.*
  //   //   FROM "SplashArtCoordinates" AS sac
  //   //   JOIN (${join({
  //   //     table: 'ReviewWinnerArts',
  //   //     type: 'left',
  //   //     on: {
  //   //       postId: field('postId')
  //   //     },
  //   //     resolver: (reviewWinnerArtsField) => reviewWinnerArtsField('*')
  //   //   })}) AS rwa
  //   //   ON sac."reviewWinnerArtId" = rwa._id
  //   // `
  // }),
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
