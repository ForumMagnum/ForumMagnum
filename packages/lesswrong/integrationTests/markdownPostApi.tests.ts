import "./integrationTestSetup";
import { NextRequest } from "next/server";
import { renderPostMarkdownByIdOrSlug } from "../../../app/api/(markdown)/post/postMarkdownUtils";
import { createDummyPost, createDummyUser } from "./utils";

describe("Post Markdown API", () => {
  it("returns not found for a draft the requester cannot access", async () => {
    const owner = await createDummyUser();
    const draft = await createDummyPost(owner, { draft: true });
    const request = new NextRequest(`http://localhost/api/post/${draft._id}`);

    const response = await renderPostMarkdownByIdOrSlug(request, draft._id);

    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toContain("No post found");
  });

  it("continues to return public posts", async () => {
    const owner = await createDummyUser();
    const post = await createDummyPost(owner, { draft: false });
    const request = new NextRequest(`http://localhost/api/post/${post._id}`);

    const response = await renderPostMarkdownByIdOrSlug(request, post._id);

    expect(response.status).toBe(200);
  });
});
