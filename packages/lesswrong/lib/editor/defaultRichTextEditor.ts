import { getUserABTestGroup } from "@/lib/abTestImpl";
import { lexicalEditorABTest } from "@/lib/abTests";
import { userUseMarkdownPostEditor } from "@/lib/collections/users/helpers";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";

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
  if (!user) return "ckEditorMarkup";
  if (userIsAdmin(user)) return "lexical";
  if (user.beta) {
    const abTestGroup = getUserABTestGroup({ user }, lexicalEditorABTest);
    return abTestGroup === "lexical" ? "lexical" : "ckEditorMarkup";
  }
  return "ckEditorMarkup";
};

