import { insufficientDraftAccessMessage, requiredAccessForMode } from "../../../app/api/agent/editorAgentUtil";

describe("agent draft access", () => {
  it("requires comment access for suggestions and edit access for direct edits", () => {
    expect(requiredAccessForMode("suggest")).toBe("comment");
    expect(requiredAccessForMode("edit")).toBe("edit");
  });

  it.each([
    ["none", "comment", false],
    ["read", "comment", false],
    ["read", "edit", false],
    ["comment", "comment", true],
    ["comment", "edit", false],
    ["edit", "comment", true],
    ["edit", "edit", true],
  ] as const)("with %s access, an operation needing %s access is allowed: %s", (accessLevel, requiredAccess, allowed) => {
    const message = insufficientDraftAccessMessage(accessLevel, requiredAccess);
    expect(message === null).toBe(allowed);
  });

  it("tells comment-level users that they can still make suggestions", () => {
    expect(insufficientDraftAccessMessage("comment", "edit")).toContain("mode 'suggest'");
  });
});
