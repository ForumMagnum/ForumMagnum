import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
// import type { NewCollectionFieldSpecification } from "@/lib/types/schemaTypes"; // Removed import - type should be global

// --- Define Allowed Values ---
const ALLOWED_COLLECTION_NAMES = ["Posts", "Comments", "Spotlights"];
const ALLOWED_EVENT_TYPES = ["served", "viewed", "interacted"];
// --- ---

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  documentId: {
    database: {
      type: "TEXT", // Assuming document IDs are strings (like Mongo ObjectIds or UUIDs)
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!", // Required when creating
      canRead: ["admins"], // Changed from guests
      canCreate: ["members"], // Default permission
      // Usually not updatable
      validation: {
        optional: false, // Make sure it's provided
      },
    },
    form: {
       label: "Document ID",
       // hidden: true // Likely not needed in forms
    }
  } satisfies NewCollectionFieldSpecification<"UltraFeedEvents">,

  collectionName: {
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
        allowedValues: ALLOWED_COLLECTION_NAMES,
        optional: false,
      },
    },
    form: {
      label: "Collection Name",
      control: "select", // Makes sense for allowed values
      form: { // Provides options for the select dropdown
         options: () => ALLOWED_COLLECTION_NAMES.map(name => ({ label: name, value: name }))
      }
    }
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
    form: {
        label: "Event Type",
        control: "select",
        form: {
           options: () => ALLOWED_EVENT_TYPES.map(type => ({ label: type, value: type }))
        }
    }
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
      type: "JSONB", // Use JSONB for efficient storage of arbitrary JSON in Postgres
      nullable: true, // Make it true if event data is not always required
    },
    graphql: {
      outputType: "JSON", // Use the GraphQL JSON scalar type
      inputType: "JSON",
      canRead: ["admins"], // Changed from guests
      canCreate: ["members"], // Adjust as needed
      validation: {
        optional: true, // Make it true if event data is not always required
        blackbox: true, // Allows any valid JSON structure
      },
    },
    form: {
        label: "Event Data",
        // control: "textarea" // Maybe a textarea for raw JSON input if needed in forms?
        // hidden: true // Probably not directly edited in forms
    }
  } satisfies NewCollectionFieldSpecification<"UltraFeedEvents">,

  feedItemId: {
    database: {
      type: "TEXT", // Assuming the ID is stored as text/string
      nullable: true, // Changed from false - Assume mandatory
    },
    graphql: {
      outputType: "String", // The ID itself is a string
      inputType: "String",  // Changed from String! - Required input when creating
      canRead: ["admins"],   // Consistent with other fields
      canCreate: ["members"], // Consistent with other fields
      // TODO: Add resolveAs once the UltrafeedItems collection exists
      // resolveAs: {
      //   fieldName: 'ultrafeedItem', // Name of the resolved field
      //   typeName: 'UltrafeedItem', // GraphQL type of the related object
      //   relation: 'hasOne',
      //   // Replace 'UltrafeedItems' if the actual collection name is different
      //   foreignCollectionName: "UltrafeedItems"
      // },
      validation: {
        optional: true, // Changed from false - Assume mandatory
      },
    },
    form: {
      label: "Feed Item ID",
      // hidden: true // Likely not directly set in a form
    }
  } satisfies NewCollectionFieldSpecification<"UltraFeedEvents">,

} satisfies Record<string, NewCollectionFieldSpecification<"UltraFeedEvents">>;

export default schema;

// Optional: Define a matching TypeScript interface
export interface UltrafeedEvent {
  _id?: string;
  createdAt?: Date;
  userId: string;
  // user?: UserType; // Add if you have a User type and resolve the user object
  documentId: string;
  collectionName: typeof ALLOWED_COLLECTION_NAMES[number];
  eventType: typeof ALLOWED_EVENT_TYPES[number];
  feedItemId?: string;
  event?: Record<string, any>; // Or a more specific type if the structure is known
}
