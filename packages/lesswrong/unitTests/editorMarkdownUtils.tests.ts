import {
  EMPTY_LEXICAL_ROOT_AFTER_SYNC_MESSAGE,
  isEmptyLexicalRootAfterSyncError,
} from "../../../app/api/agent/editorAgentUtil";
import { getLiveEditorDraftMarkdownErrorMessage } from "../../../app/api/(markdown)/editorMarkdownUtils";

describe("editPost markdown error messages", () => {
  it("identifies empty Lexical root sync errors", () => {
    const error = new Error(`[MarkdownReadDraft] ${EMPTY_LEXICAL_ROOT_AFTER_SYNC_MESSAGE} for Posts abc123.`);

    expect(isEmptyLexicalRootAfterSyncError(error)).toBe(true);
    expect(isEmptyLexicalRootAfterSyncError(new Error("Timed out waiting for Hocuspocus sync"))).toBe(false);
  });

  it("distinguishes uninitialized draft bodies from sharing permission failures", () => {
    const postId = "abc123";
    const message = getLiveEditorDraftMarkdownErrorMessage({
      postId,
      error: new Error(`[MarkdownReadDraft] ${EMPTY_LEXICAL_ROOT_AFTER_SYNC_MESSAGE} for Posts ${postId}.`),
    });

    expect(message).toContain(`postId: ${postId}`);
    expect(message).toContain("empty or uninitialized");
    expect(message).toContain("not a sharing-permissions problem");
    expect(message).not.toContain(`"Anyone with the link can" to "Edit"`);
  });

  it("keeps the existing permissions guidance for unknown errors", () => {
    const message = getLiveEditorDraftMarkdownErrorMessage({
      postId: "abc123",
      error: new Error("Something else failed"),
    });

    expect(message).toContain("Unable to access shared draft");
    expect(message).toContain(`"Anyone with the link can" to "Edit"`);
  });
});
