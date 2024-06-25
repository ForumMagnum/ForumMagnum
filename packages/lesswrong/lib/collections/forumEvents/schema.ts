import { foreignKeyField, resolverOnlyField } from "../../utils/schemaUtils";

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
  contrastColor: {
    ...defaultProps(),
    optional: true,
    nullable: true,
    type: String,
    control: "FormComponentColorPicker",
    label: "Contrast color (optional, used very rarely)"
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
  includesPoll: {
    ...defaultProps(),
    optional: true,
    nullable: true,
    type: Boolean,
    control: "FormComponentCheckbox",
  },
  // used to store public event data, like public poll votes
  publicData: {
    type: Object,
    blackbox: true,
    optional: true,
    nullable: true,
    hidden: true,
    canRead: ["guests"],
    canUpdate: ["members"],
    canCreate: ["members"],
  },
  voteCount: resolverOnlyField({
    graphQLtype: 'Int!',
    type: Number,
    canRead: ['guests'],
    resolver: ({publicData}: DbForumEvent): number => publicData ? Object.keys(publicData).length : 0,
  }),
};

export default schema;
