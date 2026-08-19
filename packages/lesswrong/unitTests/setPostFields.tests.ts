import {
  setPostFieldsRouteSchema,
  validateSetPostFieldsInput,
} from "../../../app/api/agent/toolSchemas";
import { getPostFieldsUpdateError } from "../../../app/api/agent/setPostFields/route";

describe("setPostFields input validation", () => {
  it("requires at least one metadata field", () => {
    expect(validateSetPostFieldsInput({})).toBe("Provide at least one of title or url.");
    expect(setPostFieldsRouteSchema.safeParse({ postId: "post-id" }).success).toBe(false);
  });

  it("trims title and URL values", () => {
    const result = setPostFieldsRouteSchema.safeParse({
      postId: "post-id",
      title: "  Updated title  ",
      url: "  https://example.com/post  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Updated title");
      expect(result.data.url).toBe("https://example.com/post");
    }
  });

  it("accepts null to clear a linkpost URL", () => {
    expect(setPostFieldsRouteSchema.safeParse({
      postId: "post-id",
      url: null,
    }).success).toBe(true);
  });
});

describe("setPostFields post validation", () => {
  it("allows title updates on ordinary drafts", () => {
    const post = {
      draft: true,
      postCategory: "post",
    } satisfies Pick<DbPost, "draft" | "postCategory">;

    expect(getPostFieldsUpdateError(post, { title: "New title" })).toBeNull();
  });

  it("allows URL updates only on linkpost drafts", () => {
    const ordinaryDraft = {
      draft: true,
      postCategory: "post",
    } satisfies Pick<DbPost, "draft" | "postCategory">;
    const linkpostDraft = {
      draft: true,
      postCategory: "linkpost",
    } satisfies Pick<DbPost, "draft" | "postCategory">;

    expect(getPostFieldsUpdateError(ordinaryDraft, { url: "https://example.com" }))
      .toBe("The url field can only be changed on linkpost drafts.");
    expect(getPostFieldsUpdateError(linkpostDraft, { url: "https://example.com" })).toBeNull();
  });

  it("rejects metadata updates after publication", () => {
    const publishedPost = {
      draft: false,
      postCategory: "linkpost",
    } satisfies Pick<DbPost, "draft" | "postCategory">;

    expect(getPostFieldsUpdateError(publishedPost, { title: "New title" }))
      .toBe("Post metadata can only be changed through the agent API while the post is a draft.");
  });
});
