import { resolverOnlyField } from "../../utils/schemaUtils";

export const schema: SchemaType<"ReviewWinnerArts"> = {
  postId: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
  },
  splashArtImagePrompt: {
    type: String,
    canRead: ['guests'],
    canCreate: ['sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    optional: false,
    nullable: false,
  },
  splashArtImageUrl: {
    type: String,
    canRead: ['guests'],
    canCreate: ['sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    optional: false,
    nullable: false,
  },
  activeSplashArtCoordinates: resolverOnlyField({
    type: "SplashArtCoordinate",
    graphQLtype: "SplashArtCoordinate",
    canRead: ['guests'],
    resolver: async (reviewWinnerArt: DbReviewWinnerArt, args: void, context: ResolverContext): Promise<DbSplashArtCoordinate|null> => {
      const { SplashArtCoordinates, repos } = context;
      return SplashArtCoordinates.findOne({ reviewWinnerArtId: reviewWinnerArt._id }, { sort: { createdAt: -1 } });
    },
  }),

}
