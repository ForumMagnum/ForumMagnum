const defaultProps = (): CollectionFieldSpecification<"ForumEvents"> => ({
  optional: false,
  nullable: false,
  canRead: ["guests"],
  canUpdate: ["admins"],
  canCreate: ["admins"],
});

const schema: SchemaType<"ForumEvents"> = {
  title: {
    ...defaultProps(),
    type: String,
  },
  startDate: {
    ...defaultProps(),
    type: Date,
    control: "datetime",
  },
  endDate: {
    ...defaultProps(),
    type: Date,
    control: "datetime",
  },
  darkColor: {
    ...defaultProps(),
    type: String, // TODO: Color picker
  },
  lightColor: {
    ...defaultProps(),
    type: String, // TODO: Color picker
  },
  tagId: {
    ...defaultProps(),
    type: String,
    control: "TagSelect",
  },
  imageId: {
    ...defaultProps(),
    type: String,
    control: "ImageUpload",
  },
};

export default schema;
