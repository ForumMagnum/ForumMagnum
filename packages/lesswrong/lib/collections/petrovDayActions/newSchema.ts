import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";

const ACTION_TYPES = [
  "optIn",
  "hasRole",
  "hasSide",
  "nukeTheWest",
  "nukeTheEast",
  "eastPetrovAllClear",
  "eastPetrovNukesIncoming",
  "westPetrovAllClear",
  "westPetrovNukesIncoming",
] as const;

const ACTION_TYPES_SET = new TupleSet(ACTION_TYPES);
export type PetrovDayActionType = UnionOf<typeof ACTION_TYPES_SET>;

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  // NOTE: this whole schema is bad, sorry Robert
  actionType: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        allowedValues: [
          "optIn",
          "hasRole",
          "hasSide",
          "nukeTheWest",
          "nukeTheEast",
          "eastPetrovAllClear",
          "eastPetrovNukesIncoming",
          "westPetrovAllClear",
          "westPetrovNukesIncoming",
        ],
      },
    },
    form: {
      form: {
        options: () => [...ACTION_TYPES].map((key) => ({ label: key, value: key })),
      },
    },
  },
  data: {
    database: {
      type: "JSONB",
      nullable: true,
    },
    graphql: {
      outputType: "JSON",
      canRead: ["guests"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
  },
  userId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canCreate: ["members"],
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"PetrovDayActions">>;

export default schema;
