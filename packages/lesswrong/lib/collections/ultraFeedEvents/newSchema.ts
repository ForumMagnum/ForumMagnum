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
      validation: {
        optional: false,
      },
    },
  } satisfies NewCollectionFieldSpecification<"UltraFeedEvents">,

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
        optional: false,
      },
    },
  } satisfies NewCollectionFieldSpecification<"UltraFeedEvents">,

  eventType: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["admins"], // Changed from guests
      canCreate: ["members"],
      validation: {
        allowedValues: ALLOWED_EVENT_TYPES,
        optional: false,
      },
    },
  } satisfies NewCollectionFieldSpecification<"UltraFeedEvents">,

  userId: {
    database: {
      type: "TEXT", // Stores the user ID string
      nullable: false, // Assuming an event always has a user initiator
    },
    graphql: {
      outputType: "String", // Outputs the ID string
      inputType: "String!",
      canRead: ["admins"], // Changed from guests
      canCreate: ["members"],
      // Add resolver here later if you want to automatically fetch the User object
      // resolveAs: { ... }
      validation: {
        optional: false,
      },
    },
    form: {
        label: "User ID",
        // hidden: true // Often automatically filled or not user-editable
    }
  } satisfies NewCollectionFieldSpecification<"UltraFeedEvents">,

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
    form: {
        label: "Event Data",
        // hidden: true
    }
  } satisfies NewCollectionFieldSpecification<"UltraFeedEvents">,

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
      // TODO: Add resolveAs once the UltrafeedItems collection exists
      // resolveAs: {
      //   fieldName: 'ultrafeedItem', // Name of the resolved field
      //   typeName: 'UltrafeedItem', // GraphQL type of the related object
      //   relation: 'hasOne',
      //   // Replace 'UltrafeedItems' if the actual collection name is different
      //   foreignCollectionName: "UltrafeedItems"
      // },
      validation: {
        optional: true,
      },
    },
  } satisfies NewCollectionFieldSpecification<"UltraFeedEvents">,

} satisfies Record<string, NewCollectionFieldSpecification<"UltraFeedEvents">>;

export default schema;

// Define a matching TypeScript interface
export interface UltrafeedEvent {
  _id?: string;
  createdAt?: Date;
  userId: string;
  documentId: string;
  collectionName: typeof ALLOWED_COLLECTION_NAMES[number];
  eventType: typeof ALLOWED_EVENT_TYPES[number];
  feedItemId?: string;
  event?: Record<string, any>; // Or a more specific type if the structure is known
}

interface ExpandedEventData {
  expansionLevel: number;
  maxExpansionReached: boolean;
  wordCount: number;
}

interface UltraFeedEventBase {
  _id?: string;
  createdAt?: Date;
  userId: string;
  documentId: string;
  collectionName: typeof ALLOWED_COLLECTION_NAMES[number];
  feedItemId?: string;
}

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
