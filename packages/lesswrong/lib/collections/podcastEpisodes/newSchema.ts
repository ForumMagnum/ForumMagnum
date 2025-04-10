import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { generateIdResolverSingle } from "../../utils/schemaUtils";

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  podcastId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Podcasts",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canCreate: ["podcasters", "admins"],
      validation: {
        optional: true,
      },
    },
  },
  podcast: {
    graphql: {
      outputType: "Podcast!",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Podcasts", fieldName: "podcastId" }),
    },
  },
  title: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canCreate: ["podcasters", "admins"],
    },
  },
  episodeLink: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canCreate: ["podcasters", "admins"],
    },
  },
  externalEpisodeId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canCreate: ["podcasters", "admins"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"PodcastEpisodes">>;

export default schema;
