import { liveDraftReadFailureMessage } from "../../../app/api/(markdown)/editorMarkdownUtils";

describe("liveDraftReadFailureMessage", () => {
  it("does not blame sharing permissions when the live Lexical doc is uninitialized", () => {
    const message = liveDraftReadFailureMessage(
      "testPostId",
      new Error("[MarkdownReadDraft] Lexical editor root is empty after Hocuspocus sync for Posts testPostId."),
    );

    expect(message).toContain("Access to shared draft testPostId was authorized");
    expect(message).toContain("appears to be uninitialized");
    expect(message).toContain("open the draft in the LessWrong editor once");
    expect(message).not.toContain("Anyone with the link can");
  });

  it("reports live editor service failures separately from authorization", () => {
    const message = liveDraftReadFailureMessage(
      "testPostId",
      new Error("Timed out waiting for Hocuspocus sync"),
    );

    expect(message).toContain("Access to shared draft testPostId was authorized");
    expect(message).toContain("live editor service is currently unavailable");
    expect(message).not.toContain("sharing permissions");
  });
});
