import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";
import { foreignKeyField, resolverOnlyField, schemaDefaultValue } from "../../utils/schemaUtils";

const EVENT_FORMATS = ["BASIC", "POLL", "STICKERS"] as const;
const EVENT_FORMATS_SET = new TupleSet(EVENT_FORMATS)
export type ForumEventFormat = UnionOf<typeof EVENT_FORMATS_SET>

const defaultProps = (nullable = false): CollectionFieldSpecification<"ForumEvents"> => ({
  optional: nullable,
  nullable,
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
  postId: {
    ...defaultProps(true),
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: true,
    }),
    label: "Choose post ID",
  },
  bannerImageId: {
    ...defaultProps(),
    optional: true,
    nullable: true,
    type: String,
    control: "ImageUpload",
  },
  /** @deprecated Set `eventFormat` to "POLL" instead */
  includesPoll: {
    ...defaultProps(),
    ...schemaDefaultValue(false),
    hidden: true,
    optional: true,
    type: Boolean,
    control: "FormComponentCheckbox",
  },
  eventFormat: {
    ...defaultProps(),
    ...schemaDefaultValue("BASIC"),
    allowedValues: Array.from(EVENT_FORMATS),
    control: "select",
    optional: true,
    type: String,
    options: () => EVENT_FORMATS.map(ef => ({value: ef, label: ef}))
  },
  customComponent: {
    ...defaultProps(true),
    type: String,
  },
  /**
  Used to store public event data, like public poll votes.
  For the AI Welfare Debate Week, it was structured like:
  {<userId>: {
    x: <number>,
    points: {
      <postId>: <number>
    }
  }}
   */
  publicData: {
    type: Object,
    blackbox: true,
    optional: true,
    nullable: true,
    hidden: true,
    canRead: ["guests"],
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
