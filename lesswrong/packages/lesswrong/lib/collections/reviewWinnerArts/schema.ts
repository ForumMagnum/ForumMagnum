import { accessFilterSingle, resolverOnlyField } from "../../utils/schemaUtils";
import { getReviewWinnerArtCoordinates } from "../splashArtCoordinates/cache";

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
    resolver: async (reviewWinnerArt: DbReviewWinnerArt, args: void, context: ResolverContext) => {
      const { currentUser, SplashArtCoordinates } = context;

      const coordinates = await getReviewWinnerArtCoordinates(reviewWinnerArt._id, context);

      return accessFilterSingle(currentUser, SplashArtCoordinates, coordinates, context);
    },
  }),
}
