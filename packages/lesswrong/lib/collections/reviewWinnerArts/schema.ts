import { accessFilterSingle, resolverOnlyField } from "../../utils/schemaUtils";
import { universalFields } from "../../collectionUtils";

export const schema: SchemaType<"ReviewWinnerArts"> = {
  ...universalFields({}),
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
      const { currentUser } = context;

      // There's an annoying dependency cycle here
      // We could also pull this out to a server-side augmentation later, if preferred
      // TODO: figure out how to fix this to avoid esbuild headaches
      const { getReviewWinnerArtCoordinates } = require('../../../server/review/splashArtCoordinatesCache');

      const coordinates = await getReviewWinnerArtCoordinates(reviewWinnerArt._id, context);

      return accessFilterSingle(currentUser, 'SplashArtCoordinates', coordinates, context);
    },
  }),
}

export default schema;
