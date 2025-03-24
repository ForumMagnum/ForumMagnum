// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LATEST_REVISION_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { defaultEditorPlaceholder, getDenormalizedEditableResolver, getNormalizedEditableResolver, getNormalizedEditableSqlResolver, getRevisionsResolver, getVersionResolver, RevisionStorageType } from "@/lib/editor/make_editable";
import { generateIdResolverSingle } from "../../utils/schemaUtils";
import { EVENT_FORMATS } from "./types";
import type { MakeEditableOptions } from "@/lib/editor/makeEditableOptions";

const formGroups = {
  pollEventOptions: {
    name: "pollEventOptions",
    order: 10,
    label: '"POLL" Event Options',
    startCollapsed: true,
  },
  stickerEventOptions: {
    name: "stickerEventOptions",
    order: 20,
    label: '"STICKER" Event Options',
    startCollapsed: true,
  },
} satisfies Partial<Record<string, FormGroupType<"ForumEvents">>>;

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

function getDefaultEditorPlaceholder() {
  return defaultEditorPlaceholder;
}

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  frontpageDescription: {
    database: {
      type: "JSONB",
      nullable: true,
      logChanges: false,
      typescriptType: "EditableFieldContents",
    },
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("ForumEvents", "frontpageDescription"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      form: {
        label: "Frontpage description",
        hintText: getDefaultEditorPlaceholder,
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
  frontpageDescription_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  frontpageDescriptionMobile: {
    database: {
      type: "JSONB",
      nullable: true,
      logChanges: false,
      typescriptType: "EditableFieldContents",
    },
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("ForumEvents", "frontpageDescriptionMobile"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      form: {
        label: "Frontpage description (mobile)",
        hintText: getDefaultEditorPlaceholder,
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
  frontpageDescriptionMobile_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  postPageDescription: {
    database: {
      type: "JSONB",
      nullable: true,
      logChanges: false,
      typescriptType: "EditableFieldContents",
    },
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("ForumEvents", "postPageDescription"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      form: {
        label: "Post page description",
        hintText: getDefaultEditorPlaceholder,
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
  postPageDescription_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
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
  /** @deprecated Set `eventFormat` to "POLL" instead */
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
    form: {
      control: "FormComponentCheckbox",
      hidden: true,
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
  pollQuestion: {
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: ["admins"],
      canCreate: ["admins"],
      editableFieldOptions: { pingbacks: false, normalized: true },
      arguments: "version: String",
      resolver: getNormalizedEditableResolver("pollQuestion"),
      sqlResolver: getNormalizedEditableSqlResolver("pollQuestion"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      form: {
        label: "Poll question",
        hintText: () => 'Write the poll question as plain text (no headings), footnotes will appear as tooltips on the frontpage',
        fieldName: "pollQuestion",
        collectionName: "ForumEvents",
        commentEditor: true,
        commentStyles: true,
        hideControls: true,
      },
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: (forumEvent) => {
          return {
            id: `forumEvent:pollQuestion:${forumEvent?._id ?? "create"}`,
            verify: true,
          };
        },
        revisionsHaveCommitMessages: false,
      },
    },  
  },
  pollQuestion_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  pollAgreeWording: {
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
      group: () => formGroups.pollEventOptions,
    }
  },
  pollDisagreeWording: {
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
      group: () => formGroups.pollEventOptions,
    }
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
    form: {},
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
    form: {
      hidden: true,
    },
  },
  voteCount: {
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
      resolver: ({ publicData }) => (publicData ? Object.keys(publicData).length : 0),
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"ForumEvents">>;

export default schema;
