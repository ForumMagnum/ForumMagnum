export type RichTextEditorType = "lexical" | "ckEditorMarkup";

/**
 * Returns the default rich-text editor for a user.
 *
 * This intentionally never returns "markdown": users who prefer markdown fall
 * back to whichever one of lexical or CKEditor they'd get if they had markdown
 * disabled.
 */
export const getUserDefaultRichTextEditor = (
  user: UsersCurrent | DbUser | null
): RichTextEditorType => {
  return "lexical";
};

