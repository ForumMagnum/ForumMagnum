import { shouldRenderSingleLineComment } from "../components/comments/commentTree";

describe("comment tree single-line display", () => {
  it("honors the expand-single-line-comments preference by default", () => {
    expect(shouldRenderSingleLineComment({
      singleLine: true,
      currentUserNoSingleLineCommentsSetting: true,
      forceSingleLine: true,
      isTruncated: true,
    })).toBe(false);
  });

  it("allows intentionally single-line index rows to ignore the preference", () => {
    expect(shouldRenderSingleLineComment({
      singleLine: true,
      currentUserNoSingleLineCommentsSetting: true,
      forceSingleLine: true,
      ignoreNoSingleLineCommentsSetting: true,
      isTruncated: false,
    })).toBe(true);
  });

  it("does not render single-line rows when initial single-line state is off", () => {
    expect(shouldRenderSingleLineComment({
      singleLine: false,
      currentUserNoSingleLineCommentsSetting: false,
      forceSingleLine: true,
      ignoreNoSingleLineCommentsSetting: true,
      isTruncated: true,
    })).toBe(false);
  });
});
