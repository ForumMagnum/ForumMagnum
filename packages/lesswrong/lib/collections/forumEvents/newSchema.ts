// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { defaultEditorPlaceholder, getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver } from "@/lib/editor/make_editable";
import { generateIdResolverSingle } from "../../utils/schemaUtils";
import { EVENT_FORMATS } from "./types";
import type { MakeEditableOptions } from "@/lib/editor/makeEditableOptions";

const formGroups: Partial<Record<string, FormGroupType<"ForumEvents">>> = {
  stickerEventOptions: {
    name: "stickerEventOptions",
    order: 10,
    label: '"STICKER" Event Options',
    startCollapsed: true,
  },
};

const defaultProps = (nullable = false): CollectionFieldSpecification<"ForumEvents"> => ({
  optional: nullable,
  nullable,
  canRead: ["guests"],
  canUpdate: ["admins"],
  canCreate: ["admins"],
});

const defaultEditableProps: Pick<
  MakeEditableOptions<"ForumEvents">,
  "commentEditor" | "commentStyles" | "hideControls" | "permissions"
> = {
  commentEditor: true,
  commentStyles: true,
  hideControls: true,
  permissions: {
    canRead: ["guests"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
  },
};

const hRyJXH = () => defaultEditorPlaceholder;

const schema: Record<string, NewCollectionFieldSpecification<"ForumEvents">> = {
  _id: {
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
  },
  schemaVersion: {
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
  },
  createdAt: {
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
  },
  legacyData: {
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
      },
    },
  },
  frontpageDescription: {
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("ForumEvents", "frontpageDescription"),
    },
    form: {
      form: {
        label: "Frontpage description",
        hintText: hRyJXH,
        fieldName: "frontpageDescription",
        collectionName: "ForumEvents",
        commentEditor: true,
        commentStyles: true,
        hideControls: true,
      },
      order: 0,
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: (forumEvent) => {
          return {
            id: `forumEvent:frontpageDescription:${forumEvent?._id ?? "create"}`,
            verify: true,
          };
        },
        revisionsHaveCommitMessages: false,
      },
    },
  },
  frontpageDescription_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  frontpageDescriptionRevisions: {
    graphql: {
      outputType: "[Revision]",
      canRead: ["guests"],
      arguments: "limit: Int = 5",
      resolver: getRevisionsResolver("frontpageDescriptionRevisions"),
    },
  },
  frontpageDescriptionVersion: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("frontpageDescriptionVersion"),
    },
  },
  frontpageDescriptionMobile: {
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("ForumEvents", "frontpageDescriptionMobile"),
    },
    form: {
      form: {
        label: "Frontpage description (mobile)",
        hintText: hRyJXH,
        fieldName: "frontpageDescriptionMobile",
        collectionName: "ForumEvents",
        commentEditor: true,
        commentStyles: true,
        hideControls: true,
      },
      order: 0,
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: (forumEvent) => {
          return {
            id: `forumEvent:frontpageDescriptionMobile:${forumEvent?._id ?? "create"}`,
            verify: true,
          };
        },
        revisionsHaveCommitMessages: false,
      },
    },
  },
  frontpageDescriptionMobile_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  frontpageDescriptionMobileRevisions: {
    graphql: {
      outputType: "[Revision]",
      canRead: ["guests"],
      arguments: "limit: Int = 5",
      resolver: getRevisionsResolver("frontpageDescriptionMobileRevisions"),
    },
  },
  frontpageDescriptionMobileVersion: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("frontpageDescriptionMobileVersion"),
    },
  },
  postPageDescription: {
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("ForumEvents", "postPageDescription"),
    },
    form: {
      form: {
        label: "Post page description",
        hintText: hRyJXH,
        fieldName: "postPageDescription",
        collectionName: "ForumEvents",
        commentEditor: true,
        commentStyles: true,
        hideControls: true,
      },
      order: 0,
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: (forumEvent) => {
          return {
            id: `forumEvent:postPageDescription:${forumEvent?._id ?? "create"}`,
            verify: true,
          };
        },
        revisionsHaveCommitMessages: false,
      },
    },
  },
  postPageDescription_latest: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      validation: {
        optional: true,
      },
    },
  },
  postPageDescriptionRevisions: {
    graphql: {
      outputType: "[Revision]",
      canRead: ["guests"],
      arguments: "limit: Int = 5",
      resolver: getRevisionsResolver("postPageDescriptionRevisions"),
    },
  },
  postPageDescriptionVersion: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("postPageDescriptionVersion"),
    },
  },
  title: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
    form: {
      control: "MuiTextField",
    },
  },
  startDate: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      inputType: "Date!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
    form: {
      form: { below: true },
      control: "datetime",
    },
  },
  endDate: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      inputType: "Date!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
    form: {
      form: { below: true },
      control: "datetime",
    },
  },
  darkColor: {
    database: {
      type: "TEXT",
      defaultValue: "#000000",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
    form: {
      label: "Primary background color",
      tooltip:
        'Used as the background of the banner for basic events. Sometimes used as a text color with "Secondary background color" ("lightColor" in the schema) as the background, so these should be roughly inverses of each other.',
      control: "FormComponentColorPicker",
    },
  },
  lightColor: {
    database: {
      type: "TEXT",
      defaultValue: "#ffffff",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
    form: {
      label: "Secondary background color",
      tooltip:
        'Used as the background in some places (e.g. topic tabs) with "Primary background color" as the foreground, so these should be roughly inverses of each other.',
      control: "FormComponentColorPicker",
    },
  },
  bannerTextColor: {
    database: {
      type: "TEXT",
      defaultValue: "#ffffff",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
    },
    form: {
      tooltip:
        'Color of the text on the main banner, and for some event types the text in the header (e.g. "Effective Altruism Forum"). For many events its ok to leave this as white, it may be useful to set for events where the primary background color is light.',
      control: "FormComponentColorPicker",
    },
  },
  contrastColor: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Accent color (optional, used very rarely)",
      control: "FormComponentColorPicker",
    },
  },
  tagId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Tags",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Choose tag",
      control: "TagSelect",
    },
  },
  tag: {
    graphql: {
      outputType: "Tag",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Tags", fieldName: "tagId" }),
    },
  },
  postId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Posts",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Choose post ID",
    },
  },
  post: {
    graphql: {
      outputType: "Post",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Posts", fieldName: "postId" }),
    },
  },
  bannerImageId: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      control: "ImageUpload",
    },
  },
  includesPoll: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  eventFormat: {
    database: {
      type: "TEXT",
      defaultValue: "BASIC",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        allowedValues: ["BASIC", "POLL", "STICKERS"],
        optional: true,
      },
    },
    form: {
      options: () =>
        EVENT_FORMATS.map((ef) => ({
          value: ef,
          label: ef,
        })),
      control: "select",
    },
  },
  maxStickersPerUser: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 1,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.stickerEventOptions,
    },
  },
  customComponent: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
  },
  commentPrompt: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      validation: {
        optional: true,
      },
    },
    form: {
      tooltip: 'For events with comments, the title in the comment box (defaults to "Add your comment")',
    },
  },
  publicData: {
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
        blackbox: true,
      },
    },
  },
  voteCount: {
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
      resolver: ({ publicData }) => (publicData ? Object.keys(publicData).length : 0),
    },
  },
};

export default schema;
