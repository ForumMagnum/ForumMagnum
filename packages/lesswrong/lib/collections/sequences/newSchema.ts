// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

import {
  accessFilterSingle,
  accessFilterMultiple, generateIdResolverSingle
} from "../../utils/schemaUtils";
import { getWithCustomLoader } from "../../loaders";
import { preferredHeadingCase } from "../../../themes/forumTheme";
import { documentIsNotDeleted, userOwns } from "../../vulcan-users/permissions";
import { defaultEditorPlaceholder, getDefaultLocalStorageIdGenerator, getDenormalizedEditableResolver, getRevisionsResolver, getVersionResolver, RevisionStorageType } from "@/lib/editor/make_editable";

const formGroups = {
  adminOptions: {
    name: "adminOptions",
    order: 2,
    label: preferredHeadingCase("Admin Options"),
    startCollapsed: false,
  },
  advancedOptions: {
    name: "advancedOptions",
    order: 3,
    label: preferredHeadingCase("Advanced Options"),
    startCollapsed: true,
  },
} satisfies Partial<Record<string, FormGroupType<"Sequences">>>;

const schema = {
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
        blackbox: true,
      },
    },
  },
  contents: {
    database: {
      type: "JSONB",
      nullable: true,
      logChanges: false,
      typescriptType: "EditableFieldContents",
    },
    graphql: {
      outputType: "Revision",
      canRead: [documentIsNotDeleted],
      canUpdate: [userOwns, "sunshineRegiment", "admins"],
      canCreate: ["members"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Sequences", "contents"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      form: {
        hintText: () => defaultEditorPlaceholder,
        fieldName: "contents",
        collectionName: "Sequences",
        commentEditor: false,
        commentStyles: false,
        hideControls: false,
      },
      order: 20,
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: getDefaultLocalStorageIdGenerator("Sequences"),
        revisionsHaveCommitMessages: false,
      },
    },
  },
  contents_latest: {
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
  revisions: {
    graphql: {
      outputType: "[Revision]",
      canRead: ["guests"],
      arguments: "limit: Int = 5",
      resolver: getRevisionsResolver("revisions"),
    },
  },
  version: {
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      resolver: getVersionResolver("version"),
    },
  },
  lastUpdated: {
    database: {
      type: "TIMESTAMPTZ",
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
      onCreate: () => new Date(),
      onUpdate: () => new Date(),
      validation: {
        optional: true,
      },
    },
  },
  userId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Users",
      nullable: false,
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
      form: { label: "Set author" },
      control: "FormUserSelect",
      group: () => formGroups.adminOptions,
    },
  },
  user: {
    graphql: {
      outputType: "User",
      canRead: ["guests"],
      resolver: generateIdResolverSingle({ foreignCollectionName: "Users", fieldName: "userId" }),
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
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
    },
    form: {
      order: 10,
      control: "EditSequenceTitle",
      placeholder: preferredHeadingCase("Sequence Title"),
    },
  },
  // Cloudinary image id for the banner image (high resolution)
  bannerImageId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Banner Image",
      control: "ImageUpload",
    },
  },
  // Cloudinary image id for the card image
  gridImageId: {
    database: {
      type: "TEXT",
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Card Image",
      control: "ImageUpload",
    },
  },
  hideFromAuthorPage: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Hide from my user profile",
    },
  },
  draft: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      control: "checkbox",
    },
  },
  isDeleted: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: [userOwns, "admins", "sunshineRegiment"],
      canCreate: ["members"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Delete",
      tooltip: "Make sure you want to delete this sequence - it will be completely hidden from the forum.",
      control: "checkbox",
      group: () => formGroups.advancedOptions,
    },
  },
  curatedOrder: {
    database: {
      type: "DOUBLE PRECISION",
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
      group: () => formGroups.adminOptions,
    },
  },
  userProfileOrder: {
    database: {
      type: "DOUBLE PRECISION",
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  canonicalCollectionSlug: {
    database: {
      type: "TEXT",
      foreignKey: { collection: "Collections", field: "slug" },
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
      label: preferredHeadingCase("Collection Slug"),
      tooltip: "The machine-readable slug for the collection this sequence belongs to. Will affect links, so don't set it unless you have the slug exactly right.",
      control: "text",
      hidden: false,
      group: () => formGroups.adminOptions,
    },
  },
  canonicalCollection: {
    graphql: {
      outputType: "Collection",
      canRead: ["guests"],
      resolver: async (sequence, args, context) => {
        if (!sequence.canonicalCollectionSlug) return null;
        const collection = await context.Collections.findOne({
          slug: sequence.canonicalCollectionSlug,
        });
        return await accessFilterSingle(context.currentUser, "Collections", collection, context);
      },
    },
  },
  hidden: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      tooltip: "Hidden sequences don't show up on lists/search results on this site, but can still be accessed directly by anyone",
      group: () => formGroups.adminOptions,
    },
  },
  noindex: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      group: () => formGroups.adminOptions,
    },
  },
  postsCount: {
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
      resolver: async (sequence, args, context) => {
        const count = await getWithCustomLoader(context, "sequencePostsCount", sequence._id, (sequenceIds) => {
          return context.repos.sequences.postsCount(sequenceIds);
        });
        return count;
      },
    },
  },
  readPostsCount: {
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
      resolver: async (sequence, args, context) => {
        const currentUser = context.currentUser;
        if (!currentUser) return 0;
        const createCompositeId = (sequenceId: string, userId: string) => `${sequenceId}-${userId}`;
        const splitCompositeId = (compositeId: string) => {
          const [sequenceId, userId] = compositeId.split("-");
          return {
            sequenceId,
            userId,
          };
        };
        const count = await getWithCustomLoader(
          context,
          "sequenceReadPostsCount",
          createCompositeId(sequence._id, currentUser._id),
          (compositeIds) => {
            return context.repos.sequences.readPostsCount(compositeIds.map(splitCompositeId));
          }
        );
        return count;
      },
    },
  },
  // This resolver isn't used within LessWrong AFAICT, but is used by an external API user
  chapters: {
    graphql: {
      outputType: "[Chapter]",
      canRead: ["guests"],
      resolver: async (sequence, args, context) => {
        const chapters = await context.Chapters.find(
          { sequenceId: sequence._id },
          { sort: { number: 1 } }
        ).fetch();
        return await accessFilterMultiple(context.currentUser, "Chapters", chapters, context);
      },
    },
  },
  af: {
    database: {
      type: "BOOL",
      defaultValue: false,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["alignmentVoters"],
      canCreate: ["alignmentVoters"],
      validation: {
        optional: true,
      },
    },
    form: {
      label: "Alignment Forum",
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"Sequences">>;

export default schema;
