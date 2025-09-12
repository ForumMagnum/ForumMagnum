import { ServedEventData } from "@/components/ultraFeed/ultraFeedTypes";
import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const ALLOWED_COLLECTION_NAMES = ["Posts", "Comments", "Spotlights"];
const ALLOWED_EVENT_TYPES = ["served", "viewed", "expanded", "interacted", "seeLess"];

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
      canCreate: ["guests"],
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
      canCreate: ["guests"],
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
      canCreate: ["guests"],
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
      inputType: "String",
      canRead: ["admins"], 
      canCreate: ["guests"],
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
      canCreate: ["guests"],
      canUpdate: ["members"],
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
      canCreate: ["guests"],
      validation: {
        optional: true,
      },
    },
  },

} satisfies Record<string, CollectionFieldSpecification<"UltraFeedEvents">>;

export default schema;

interface ExpandedEventData {
  expansionLevel: number;
  maxExpansionReached: boolean;
  wordCount: number;
  servedEventId: string;
}

export interface InteractedEventData {
  level: "voted" | "strongVoted" | "commented" | "shared";
}

export interface SeeLessEventData {
  feedbackReasons?: {
    author?: boolean;
    topic?: boolean;
    contentType?: boolean;
    other?: boolean;
    text?: string;
  };
  cancelled?: boolean;
}

// Use Pick on the generated DB type (adjust type name 'DbUltraFeedEvent' if needed)
type UltraFeedEventBase = Pick<DbUltraFeedEvent, '_id' | 'createdAt' | 'userId' | 'documentId' | 'collectionName' | 'feedItemId'>;

// Specific event types using discriminated unions based on eventType
export type UltraFeedEvent =
  | (UltraFeedEventBase & {
      eventType: "served";
      event?: ServedEventData | null;
    })
  | (UltraFeedEventBase & {
      eventType: "viewed";
      event: { durationMs: number } | null;
    })
  | (UltraFeedEventBase & {
      eventType: "expanded";
      event: ExpandedEventData;
    })
  | (UltraFeedEventBase & {
      eventType: "interacted";
      event: InteractedEventData;
    })
  | (UltraFeedEventBase & {
      eventType: "seeLess";
      event: SeeLessEventData;
    });
