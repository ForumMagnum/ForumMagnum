import { foreignKeyField } from "../../utils/schemaUtils";

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
    control: "MuiTextField",
  },
  startDate: {
    ...defaultProps(),
    type: Date,
    control: "datetime",
    form: {
      below: true,
    },
  },
  endDate: {
    ...defaultProps(),
    type: Date,
    control: "datetime",
    form: {
      below: true,
    },
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
    ...foreignKeyField({
      idFieldName: "tagId",
      resolverName: "tag",
      collectionName: "Tags",
      type: "Tag",
      nullable: true,
    }),
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
