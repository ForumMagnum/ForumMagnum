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
    type: String,
    control: "FormComponentColorPicker",
  },
  lightColor: {
    ...defaultProps(),
    type: String,
    control: "FormComponentColorPicker",
  },
  tagId: {
    ...defaultProps(),
    type: String,
    control: "TagSelect",
    label: "Choose tag",
  },
  bannerImageId: {
    ...defaultProps(),
    optional: true,
    nullable: true,
    type: String,
    control: "ImageUpload",
  },
};

export default schema;
