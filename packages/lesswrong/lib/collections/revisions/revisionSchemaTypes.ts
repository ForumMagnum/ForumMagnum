import SimpleSchema from "simpl-schema";

/**
 * This covers the type of originalContents for all editor types.
 * (DraftJS uses object type. DraftJs is deprecated but there are still many documents that use it)
 */
export const ContentType = new SimpleSchema({
  type: String,
  data: SimpleSchema.oneOf(String, {
    type: Object,
    blackbox: true,
  }),
});

export const RevisionStorageType = new SimpleSchema({
  originalContents: { type: ContentType, optional: true },
  userId: { type: String, optional: true },
  commitMessage: { type: String, optional: true },
  html: { type: String, optional: true, denormalized: true },
  updateType: { type: String, optional: true, allowedValues: ['initial', 'patch', 'minor', 'major'] },
  version: { type: String, optional: true },
  editedAt: { type: Date, optional: true },
  wordCount: { type: SimpleSchema.Integer, optional: true, denormalized: true },
  // dataWithDiscardedSuggestions is not actually stored in the database, just passed 
  // through the mutation so that we can provide html that doesn't include private
  // information.
  dataWithDiscardedSuggestions: { type: String, optional: true, nullable: true }
});
