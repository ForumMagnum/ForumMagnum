import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD, DEFAULT_LATEST_REVISION_ID_FIELD, DEFAULT_LEGACY_DATA_FIELD, DEFAULT_SCHEMA_VERSION_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import range from "lodash/range";
import {
  accessFilterSingle,
  accessFilterMultiple
} from "../../utils/schemaUtils";
import { isLWorAF } from "../../instanceSettings";
import { defaultEditorPlaceholder, getDenormalizedEditableResolver, RevisionStorageType } from "@/lib/editor/make_editable";

const SPOTLIGHT_DOCUMENT_TYPES = ["Sequence", "Post", "Tag"] as const;

interface ShiftSpotlightItemParams {
  startBound: number;
  endBound: number;
  offset: -1 | 1;
  context: ResolverContext;
}

/**
 * Range is not inclusive of the "end"
 *
 * ex: Moving item from position 7 to position 3.  We want to shift items in the range of positions [3..6] to [4..7].
 *
 * So range(3, 7) gives us [3,4,5,6].
 *
 * `offset: -1` is to push items "backward" (when you're either creating a new spotlight item in the middle of the existing set, or moving one earlier in the order)
 *
 * `offset: 1` is to pull items "forward" (when you're moving an existing item back)
 */
const shiftSpotlightItems = async ({ startBound, endBound, offset, context }: ShiftSpotlightItemParams) => {
  const shiftRange = range(startBound, endBound);

  // Shift the intermediate spotlights backward or forward (according to `offset`)
  await context.Spotlights.rawUpdateMany(
    { position: { $in: shiftRange } },
    { $inc: { position: offset } },
    { multi: true }
  );
};

const schema = {
  _id: DEFAULT_ID_FIELD,
  schemaVersion: DEFAULT_SCHEMA_VERSION_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,
  legacyData: DEFAULT_LEGACY_DATA_FIELD,
  description: {
    database: {
      type: "JSONB",
      nullable: true,
      logChanges: false,
      typescriptType: "EditableFieldContents",
    },
    graphql: {
      outputType: "Revision",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      editableFieldOptions: { pingbacks: false, normalized: false },
      arguments: "version: String",
      resolver: getDenormalizedEditableResolver("Spotlights", "description"),
      validation: {
        simpleSchema: RevisionStorageType,
        optional: true,
      },
    },
    form: {
      form: {
        hintText: () => defaultEditorPlaceholder,
        fieldName: "description",
        collectionName: "Spotlights",
        commentEditor: true,
        commentStyles: true,
        hideControls: true,
      },
      order: 100,
      control: "EditorFormComponent",
      hidden: false,
      editableFieldOptions: {
        getLocalStorageId: (spotlight) => {
          if (spotlight._id) {
            return {
              id: `spotlight:${spotlight._id}`,
              verify: true,
            };
          }
          return {
            id: `spotlight:create`,
            verify: true,
          };
        },
        revisionsHaveCommitMessages: false,
      },
    },
  },
  description_latest: DEFAULT_LATEST_REVISION_ID_FIELD,
  documentId: {
    database: {
      type: "TEXT",
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
    },
    form: {
      order: 10,
    },
  },
  // TODO: remove `document` once old clients have cycled out and aren't querying this field anymore
  // Has been replaced by the post, sequence, and tag fields
  document: {
    graphql: {
      outputType: "Post",
      canRead: ["guests"],
      resolver: async (spotlight, args, context) => {
        switch (spotlight.documentType) {
          case "Post": {
            const document = await context.loaders.Posts.load(spotlight.documentId);
            return accessFilterSingle(context.currentUser, "Posts", document, context);
          }
          case "Sequence": {
            const document = await context.loaders.Sequences.load(spotlight.documentId);
            return accessFilterSingle(context.currentUser, "Sequences", document, context);
          }
          case "Tag": {
            const document = await context.loaders.Tags.load(spotlight.documentId);
            return accessFilterSingle(context.currentUser, "Tags", document, context);
          }
        }
      },
    },
  },
  post: {
    graphql: {
      outputType: "Post",
      canRead: ["guests"],
      resolver: async (spotlight, args, context) => {
        if (spotlight.documentType !== "Post") {
          return null;
        }
        const post = await context.loaders.Posts.load(spotlight.documentId);
        return accessFilterSingle(context.currentUser, "Posts", post, context);
      },
    },
  },
  sequence: {
    graphql: {
      outputType: "Sequence",
      canRead: ["guests"],
      resolver: async (spotlight, args, context) => {
        if (spotlight.documentType !== "Sequence") {
          return null;
        }
        const sequence = await context.loaders.Sequences.load(spotlight.documentId);
        return accessFilterSingle(context.currentUser, "Sequences", sequence, context);
      },
    },
  },
  tag: {
    graphql: {
      outputType: "Tag",
      canRead: ["guests"],
      resolver: async (spotlight, args, context) => {
        if (spotlight.documentType !== "Tag") {
          return null;
        }
        const tag = await context.loaders.Tags.load(spotlight.documentId);
        return accessFilterSingle(context.currentUser, "Tags", tag, context);
      },
    },
  },
  /**
   * Type of document that is spotlighted, from the options in DOCUMENT_TYPES.
   * Note subtle distinction: those are type names, not collection names.
   */
  documentType: {
    database: {
      type: "TEXT",
      defaultValue: SPOTLIGHT_DOCUMENT_TYPES[0],
      typescriptType: "SpotlightDocumentType",
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "String",
      inputType: "String!",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        allowedValues: [...SPOTLIGHT_DOCUMENT_TYPES],
      },
    },
    form: {
      form: {
        options: () => SPOTLIGHT_DOCUMENT_TYPES.map((documentType) => ({ label: documentType, value: documentType })),
      },
      order: 20,
      control: "select",
    },
  },
  position: {
    database: {
      type: "DOUBLE PRECISION",
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      onCreate: async ({ newDocument, context }) => {
        const [currentSpotlight, lastSpotlightByPosition] = await Promise.all([
          context.Spotlights.findOne({}, { sort: { lastPromotedAt: -1 } }),
          context.Spotlights.findOne({}, { sort: { position: -1 } }),
        ]);

        // If we don't have an active spotlight (or any spotlight), the new one should be first
        if (!currentSpotlight || !lastSpotlightByPosition) {
          return 0;
        }

        // If we didn't specify a position, by default we probably want to be inserting it right after the currently-active spotlight
        // If we're instead putting the created spotlight somewhere before the last spotlight, shift everything at and after the desired position back
        const startBound = typeof newDocument.position !== "number" ? currentSpotlight.position + 1 : newDocument.position;
        const endBound = lastSpotlightByPosition.position + 1;

        // Don't let us create a new spotlight with an arbitrarily large position
        if (startBound > endBound) {
          return endBound;
        }

        // Push all the spotlight items both at and after the about-to-be-created item's position back by 1
        await shiftSpotlightItems({
          startBound,
          endBound,
          offset: 1,
          context,
        });

        // The to-be-created spotlight's position
        return startBound;
      },
      onUpdate: async ({ data, oldDocument, context }) => {
        if (typeof data.position === "number" && data.position !== oldDocument.position) {
          // Figure out whether we're moving an existing spotlight item to an earlier position or a later position
          const pullingSpotlightForward = data.position < oldDocument.position;

          // Use that to determine which other spotlight items we need to move, and whether we correspondingly push them back or pull them forward
          const startBound = pullingSpotlightForward ? data.position : oldDocument.position + 1;
          const endBound = pullingSpotlightForward ? oldDocument.position : data.position + 1;
          const offset = pullingSpotlightForward ? 1 : -1;

          // Set the to-be-updated spotlight's position to something far out to avoid conflict with the spotlights we'll need to shift back
          await context.Spotlights.rawUpdateOne({ _id: oldDocument._id }, { $set: { position: 9001 } });

          // Shift the intermediate items backward
          await shiftSpotlightItems({
            startBound,
            endBound,
            offset,
            context,
          });

          // The to-be-updated spotlight's position will get updated back to the desired position later in the mutator
          return data.position;
        }
      },
      validation: {
        optional: true,
      },
    },
    form: {
      order: 30,
    },
  },
  duration: {
    database: {
      type: "DOUBLE PRECISION",
      defaultValue: 3,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Float",
      inputType: "Float!",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
    },
    form: {
      order: 40,
    },
  },
  customTitle: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 50,
    },
  },
  customSubtitle: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 60,
    },
  },
  subtitleUrl: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 61,
    },
  },
  headerTitle: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 65,
    },
  },
  headerTitleLeftColor: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 66,
    },
  },
  headerTitleRightColor: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 67,
    },
  },
  lastPromotedAt: {
    database: {
      type: "TIMESTAMPTZ",
      // Default to the epoch date if not specified
      defaultValue: new Date(0),
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Date",
      inputType: "Date!",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
    },
    form: {
      order: 70,
      control: "datetime",
    },
  },
  spotlightSplashImageUrl: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 88,
      tooltip:
        "Note: Large images can cause slow loading of the front page. Consider using the Cloudinary uploader instead (which will automatically resize the image)",
    },
  },
  draft: {
    database: {
      type: "BOOL",
      defaultValue: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      inputType: "Boolean!",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
    },
    form: {
      order: 80,
    },
  },
  deletedDraft: {
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
      validation: {
        optional: true,
      },
    },
    form: {
      order: 80,
      tooltip: "Remove from the spotlights page, but keep in the database.",
    },
  },
  showAuthor: {
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
      order: 85,
    },
  },
  imageFade: {
    database: {
      type: "BOOL",
      defaultValue: true,
      canAutofillDefault: true,
      nullable: false,
    },
    graphql: {
      outputType: "Boolean",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      // Note that `onCreate` has a forum-specific default value,
      // because we can't use forumType conditionals in `defaultValue` while sharing an `accepted_schema.sql` file
      onCreate: ({ document }) => document.imageFade ?? (isLWorAF ? false : true),
      validation: {
        optional: true,
      },
    },
    form: {
      order: 86,
    },
  },
  imageFadeColor: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 87,
      control: "FormComponentColorPicker",
    },
  },
  spotlightImageId: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 90,
      control: "ImageUpload",
    },
  },
  spotlightDarkImageId: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
      canUpdate: ["admins", "sunshineRegiment"],
      canCreate: ["admins", "sunshineRegiment"],
      validation: {
        optional: true,
      },
    },
    form: {
      order: 100,
      control: "ImageUpload",
    },
  },
  sequenceChapters: {
    graphql: {
      outputType: "[Chapter]",
      canRead: ["guests"],
      resolver: async (spotlight, args, context) => {
        if (!spotlight.documentId || spotlight.documentType !== "Sequence") {
          return null;
        }
        const chapters = await context.Chapters.find(
          {
            sequenceId: spotlight.documentId,
          },
          {
            limit: 100,
            sort: {
              number: 1,
            },
          }
        ).fetch();
        return await accessFilterMultiple(context.currentUser, "Chapters", chapters, context);
      },
    },
  },
} satisfies Record<string, NewCollectionFieldSpecification<"Spotlights">>;

export default schema;
