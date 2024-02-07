import { foreignKeyField, resolverOnlyField } from "../../utils/schemaUtils";

export const schema: SchemaType<"ReviewWinners"> = {
  postId: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins']
  },
  splashArtCoordinate: resolverOnlyField({ // probably do the sorting in javascript?
    type: "SplashArtCoordinate",
    graphQLtype: "SplashArtCoordinate",
    canRead: ['guests'],
    resolver: async (reviewWinner: DbReviewWinner, args: void, context: ResolverContext): Promise<DbSplashArtCoordinate|null> => {
      const { SplashArtCoordinates, ReviewWinnerArts } = context;
      const reviewWinnerArtIds = (await ReviewWinnerArts.find({postId: reviewWinner.postId}).fetch()).map(rw => rw._id) // sort to most recent! also fetch based on reviewWinner.postId
      const art = await SplashArtCoordinates.find({ reviewWinnerArtId: { $in: reviewWinnerArtIds } }).fetch();
      art.sort((a: DbSplashArtCoordinate, b: DbSplashArtCoordinate) => b.logTime.getTime() - a.logTime.getTime());
      return art[0] || null;
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
