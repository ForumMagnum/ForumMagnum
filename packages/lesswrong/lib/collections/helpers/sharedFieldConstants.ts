export const DEFAULT_ID_FIELD = {
  database: {
    type: "VARCHAR(27)",
    nullable: false,
  },
  graphql: {
    outputType: "String",
    canRead: ["guests"],
    validation: {
      optional: true,
    },
  },
} satisfies NewCollectionFieldSpecification<CollectionNameString>;

/** @deprecated There's no reason to add this field to new table schemas. */
export const DEFAULT_SCHEMA_VERSION_FIELD = {
  database: {
    type: "DOUBLE PRECISION",
    defaultValue: 1,
    canAutofillDefault: true,
    nullable: false,
  },
  graphql: {
    outputType: "Float",
    canRead: ["guests"],
    onUpdate: () => 1,
    validation: {
      optional: true,
    },
  },
} satisfies NewCollectionFieldSpecification<CollectionNameString>;

export const DEFAULT_CREATED_AT_FIELD = {
  database: {
    type: "TIMESTAMPTZ",
    nullable: false,
  },
  graphql: {
    outputType: "Date",
    canRead: ["guests"],
    onCreate: () => new Date(),
    validation: {
      optional: true,
    },
  },
} satisfies NewCollectionFieldSpecification<CollectionNameString>;

/**
 * Don't stick this field willy-nilly into new schemas unless/until it's actually needed;
 * otherwise it's pointless noise.
 */
export const DEFAULT_LEGACY_DATA_FIELD = {
  database: {
    type: "JSONB",
    nullable: true,
  },
  graphql: {
    outputType: "JSON",
    canRead: ["admins"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
    validation: {
      optional: true,
      blackbox: true,
    },
  },
  form: {
    hidden: true,
  },
} satisfies NewCollectionFieldSpecification<CollectionNameString>;
