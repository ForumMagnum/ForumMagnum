import { foreignKeyField, schemaDefaultValue } from "../../utils/schemaUtils";
import { universalFields } from "../../collectionUtils";

export const schema: SchemaType<"FeedItemServings"> = {
  ...universalFields({}),
  
  // The user this item was served to
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: false // No anonymous users, so this is required
    }),
    // No longer optional since all users must be logged in
    canRead: ['admins', 'sunshineRegiment'],
  },

  // Session identifier, useful for tracking sequence of items
  // and for anonymous users
  sessionId: {
    type: String,
    nullable: false,
    canRead: ['admins', 'sunshineRegiment'],
  },

  // When the item was served to the client
  servedAt: {
    type: Date,
    nullable: false,
    canRead: ['admins', 'sunshineRegiment'],
    // This field is required (no optional:true) and must be provided when creating records
  },

  // E.g. feedComment, feedPost, 
  renderAsType: {
    type: String,
    nullable: false,
    canRead: ['admins', 'sunshineRegiment'],
  },

  // Sources, e.g. "quickTakes", "popularComments", "subscribed"
  sources: {
    type: Array,
    optional: true,
    nullable: true,
    canRead: ['admins', 'sunshineRegiment'],
  },
  
  'sources.$': {
    type: String,
    optional: true
  },

  // Primary document information (e.g., a post, comment, or wikitag)
  primaryDocumentId: {
    type: String,
    optional: true,
    nullable: true,
    canRead: ['admins', 'sunshineRegiment'],
  },

  primaryDocumentCollectionName: {
    type: String,
    optional: true,
    nullable: true,
    typescriptType: "CollectionNameString",
    canRead: ['admins', 'sunshineRegiment'],
  },

  // Secondary documents (e.g., comments associated with a post, additional posts in a list)
  secondaryDocumentIds: {
    type: Array,
    optional: true,
    nullable: true,
    canRead: ['admins', 'sunshineRegiment'],
  },

  'secondaryDocumentIds.$': {
    type: String,
    optional: true
  },

  secondaryDocumentsCollectionName: {
    type: String,
    optional: true,
    nullable: true,
    typescriptType: "CollectionNameString",
    canRead: ['admins', 'sunshineRegiment'],
  },

  // Position in the loaded batch (0-indexed)
  position: {
    type: Number,
    nullable: false,
    canRead: ['admins', 'sunshineRegiment'],
  },

  // If this item was previously served, the id of the previous serving
  originalServingId: {
    type: String,
    optional: true,
    nullable: true,
    canRead: ['admins', 'sunshineRegiment'],
  },

  // If this item was previously served, the id of the previous serving
  mostRecentServingId: {
    type: String,
    optional: true,
    nullable: true,
    canRead: ['admins', 'sunshineRegiment'],
  },

  itemContent: {
    type: Object,
    nullable: false,
    blackbox: true,
    typescriptType: "FeedItemContent",
    optional: true,
    canRead: ['admins', 'sunshineRegiment'],
  },
};



export default schema;
