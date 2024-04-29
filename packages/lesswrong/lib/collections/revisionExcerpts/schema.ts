// Deny all permissions on these objects - they're only used internally
const commonFields = () => ({
  canRead: () => false,
  canCreate: () => false,
  canUpdate: () => false,
  hidden: true,
  optional: false,
  nullable: false,
});

const schema: SchemaType<"RevisionExcerpts"> = {
  dummy: {
    type: String,
    ...commonFields(),
  },
};

export default schema;
