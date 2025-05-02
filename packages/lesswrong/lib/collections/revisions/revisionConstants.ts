import SimpleSchema from "simpl-schema";

export const PLAINTEXT_HTML_TRUNCATION_LENGTH = 4000;
export const PLAINTEXT_DESCRIPTION_LENGTH = 2000;

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
