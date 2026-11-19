import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";
import { accessFilterMultiple } from "@/lib/utils/schemaUtils";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  revisionId: {
    database: {
      type: "VARCHAR(27)",
      foreignKey: "Revisions",
      nullable: false,
    },
    graphql: {
      outputType: "String!",
      canRead: ["guests"],
    },
  },
  preprocessorVersion: {
    database: {
      type: "INTEGER",
      nullable: false,
    },
    graphql: {
      outputType: "Int!",
      canRead: ["guests"],
    },
  },
  /**
   * What the script says before the document itself: its title, and who it's
   * by. This is part of what identifies a script, because it can change
   * without the revision changing: when a post is renamed, or an author's
   * name changes or is hidden.
   */
  introduction: {
    database: {
      type: "TEXT",
      nullable: false,
    },
  },
  /**
   * Null while the script is being built. The row is created before the
   * building starts, to claim it; see server/narration/generationClaims.ts.
   * The API only sends scripts that are finished.
   */
  scriptUrl: {
    database: {
      type: "TEXT",
      nullable: true,
    },
    graphql: {
      outputType: "String",
      canRead: ["guests"],
    },
  },
  segments: {
    graphql: {
      outputType: "[NarrationSegment!]!",
      canRead: ["guests"],
      resolver: async (narrationScript, args, context) => {
        const segments = await context.NarrationSegments.find(
          { narrationScriptId: narrationScript._id },
          { sort: { segmentIndex: 1 } },
        ).fetch();
        return await accessFilterMultiple(context.currentUser, "NarrationSegments", segments, context);
      },
    },
  },
} satisfies Record<string, CollectionFieldSpecification<"NarrationScripts">>;

export default schema;
