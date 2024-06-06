const schema: SchemaType<"Surveys"> = {
  name: {
    type: String,
    optional: false,
    nullable: false,
    canRead: ["guests"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
};

export default schema;
