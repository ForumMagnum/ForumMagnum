import { foreignKeyField } from "@/lib/utils/schemaUtils";
import { universalFields } from "../../collectionUtils";

export const schema: SchemaType<"ReviewWinnerArts"> = {
  ...universalFields({}),
  postId: {
    nullable: false,
    canRead: ['guests'],
    canCreate: ['sunshineRegiment', 'admins'],
    canUpdate: ['sunshineRegiment', 'admins'],
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
    }), 
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
  activeSplashArtCoordinates: {
    type: "SplashArtCoordinate",
    canRead: ['guests'],
    optional: true,
    // Implemented in server/resolvers/reviewWinnerArtResolvers.ts
  },
}

export default schema;
