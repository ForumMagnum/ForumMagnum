import { createDummyPost } from "../../testing/utils";
import { testStartup } from "../../testing/testMain";

testStartup();

describe("syncDocumentWithLatestRevision", () => {
  it("updates with the latest revision", async () => {
    const post = await createDummyPost();
    console.log('post.contents', post.contents)
    // TODO; complete
    expect(post._id).toBeDefined();
  });
});
