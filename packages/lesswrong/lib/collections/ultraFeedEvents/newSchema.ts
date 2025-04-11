import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const ALLOWED_COLLECTION_NAMES = ["Posts", "Comments", "Spotlights"];
const ALLOWED_EVENT_TYPES = ["served", "viewed", "expanded"];

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  documentId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["admins"],
      canCreate: ["members"],
    },
  },

  collectionName: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["admins"],
      canCreate: ["members"],
      validation: {
        allowedValues: ALLOWED_COLLECTION_NAMES,
      },
    },
  },

  eventType: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["admins"], 
      canCreate: ["members"],
      validation: {
        allowedValues: ALLOWED_EVENT_TYPES,
      },
    },
  },

  userId: {
    database: {
      type: "TEXT", 
      nullable: false, 
    },
    graphql: {
      outputType: "String", 
      inputType: "String!",
      canRead: ["admins"], 
      canCreate: ["members"],
    },
  },

  event: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      inputType: "JSON",
      canRead: ["admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
        blackbox: true,
      },
    },
  },

  feedItemId: {
    database: {
      type: "TEXT", 
      nullable: true, // TODO: once this is being provided, make it required
    },
    graphql: {
      outputType: "String",
      inputType: "String",  // TODO: once this is being provided, make it required
      canRead: ["admins"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },

} satisfies Record<string, NewCollectionFieldSpecification<"UltraFeedEvents">>;

export default schema;

interface ExpandedEventData {
  expansionLevel: number;
  maxExpansionReached: boolean;
  wordCount: number;
}

// Use Pick on the generated DB type (adjust type name 'DbUltraFeedEvent' if needed)
type UltraFeedEventBase = Pick<DbUltraFeedEvent, '_id' | 'createdAt' | 'userId' | 'documentId' | 'collectionName' | 'feedItemId'>;

// Specific event types using discriminated unions based on eventType
export type UltraFeedEvent =
  | (UltraFeedEventBase & {
      eventType: "served";
      event?: null | Record<string, never>;
    })
  | (UltraFeedEventBase & {
      eventType: "viewed";
      event?: null | Record<string, never>;
    })
  | (UltraFeedEventBase & {
      eventType: "expanded";
      event: ExpandedEventData;
    });
