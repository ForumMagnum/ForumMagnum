// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { getReviewWinnerArtCoordinates } from "@/server/review/splashArtCoordinatesCache";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  postId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  splashArtImagePrompt: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  splashArtImageUrl: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["sunshineRegiment", "admins"],
      canCreate: ["sunshineRegiment", "admins"],
    },
  },
  activeSplashArtCoordinates: {
    graphql: {
      outputType: "SplashArtCoordinate",
      canRead: ["guests"],
      resolver: async (reviewWinnerArt, args, context) => {
        const { currentUser } = context;
        const coordinates = await getReviewWinnerArtCoordinates(reviewWinnerArt._id, context);
        return accessFilterSingle(currentUser, "SplashArtCoordinates", coordinates, context);
      },
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"ReviewWinnerArts">>;

export default schema;
