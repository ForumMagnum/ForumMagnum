import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  narrationSegmentId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "NarrationSegments",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },
  voiceId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },
  modelId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },
  stability: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
    },
  },
  similarityBoost: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
    },
  },
  style: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
    },
  },
  speed: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float!",
      canRead: ["guests"],
    },
  },
  /**
   * This and the other results are null while the audio is being generated.
   * The row is created before the generating starts, to claim it; see
   * server/narration/generationClaims.ts. The API only sends audio that's
   * finished.
   */
  audioUrl: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  timingsUrl: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  durationMs: {
    database: {
      type: "INTEGER",
      nullable: true,
    },
    graphql: {
      outputType: "Int",
      canRead: ["guests"],
    },
  },
  billedCharacters: {
    database: {
      type: "INTEGER",
      nullable: true,
    },
    graphql: {
      outputType: "Int",
      canRead: ["guests"],
    },
  },
  elevenLabsRequestId: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"NarrationSegmentAudios">>;

export default schema;
