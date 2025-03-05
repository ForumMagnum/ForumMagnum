import { editableFields } from "@/lib/editor/make_editable";
import { foreignKeyField, resolverOnlyField, schemaDefaultValue } from "../../utils/schemaUtils";
import { EVENT_FORMATS } from "./types";
import type { MakeEditableOptions } from "@/lib/editor/makeEditableOptions";
import { addUniversalFields } from "../../collectionUtils";

const formGroups: Partial<Record<string, FormGroupType<"ForumEvents">>> = {
  stickerEventOptions: {
    name: "stickerEventOptions",
    order: 10,
    label: '"STICKER" Event Options',
    startCollapsed: true,
  },
}

const defaultProps = (nullable = false): CollectionFieldSpecification<"ForumEvents"> => ({
  optional: nullable,
  nullable,
  canRead: ["guests"],
  canUpdate: ["admins"],
  canCreate: ["admins"],
});

const defaultEditableProps: Pick<MakeEditableOptions<'ForumEvents'>, "commentEditor" | "commentStyles" | "hideControls" | "permissions"> = {
  commentEditor: true,
  commentStyles: true,
  hideControls: true,
  permissions: {
    canRead: ["guests"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
  },
};

const schema: SchemaType<"ForumEvents"> = {
  ...addUniversalFields({}),
  ...editableFields("ForumEvents", {
    fieldName: "frontpageDescription",
    label: "Frontpage description",
    getLocalStorageId: (forumEvent) => {
      return {
        id: `forumEvent:frontpageDescription:${forumEvent?._id ?? "create"}`,
        verify: true,
      };
    },
    ...defaultEditableProps,
  }),

  ...editableFields("ForumEvents", {
    fieldName: "frontpageDescriptionMobile",
    label: "Frontpage description (mobile)",
    getLocalStorageId: (forumEvent) => {
      return {
        id: `forumEvent:frontpageDescriptionMobile:${forumEvent?._id ?? "create"}`,
        verify: true,
      };
    },
    ...defaultEditableProps,
  }),

  ...editableFields("ForumEvents", {
    fieldName: "postPageDescription",
    label: "Post page description",
    getLocalStorageId: (forumEvent) => {
      return {
        id: `forumEvent:postPageDescription:${forumEvent?._id ?? "create"}`,
        verify: true,
      };
    },
    ...defaultEditableProps,
  }),
  
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
    ...schemaDefaultValue('#000000'),
    type: String,
    control: "FormComponentColorPicker",
    label: "Primary background color",
    tooltip: 'Used as the background of the banner for basic events. ' +
             'Sometimes used as a text color with "Secondary background color" ' +
             '("lightColor" in the schema) as the background, so these should ' +
             'be roughly inverses of each other.'
  },
  lightColor: {
    ...defaultProps(),
    ...schemaDefaultValue('#ffffff'),
    type: String,
    control: "FormComponentColorPicker",
    label: 'Secondary background color',
    tooltip: 'Used as the background in some places ' +
             '(e.g. topic tabs) with "Primary background color" as the foreground, ' +
             'so these should be roughly inverses of each other.'
  },
  bannerTextColor: {
    ...defaultProps(),
    ...schemaDefaultValue('#ffffff'),
    type: String,
    control: "FormComponentColorPicker",
    tooltip: 'Color of the text on the main banner, and for some event types ' +
             'the text in the header (e.g. "Effective Altruism Forum"). ' +
             'For many events its ok to leave this as white, it may be useful ' +
             'to set for events where the primary background color is light.'
  },
  contrastColor: {
    ...defaultProps(),
    optional: true,
    nullable: true,
    type: String,
    control: "FormComponentColorPicker",
    label: "Accent color (optional, used very rarely)"
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
    nullable: true,
    optional: true,
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
  maxStickersPerUser: {
    ...defaultProps(),
    ...schemaDefaultValue(1),
    type: Number,
    optional: true,
    group: formGroups.stickerEventOptions
  },
  customComponent: {
    ...defaultProps(true),
    type: String,
  },
  commentPrompt: {
    ...defaultProps(true),
    type: String,
    optional: true,
    tooltip: 'For events with comments, the title in the comment box (defaults to "Add your comment")'
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
