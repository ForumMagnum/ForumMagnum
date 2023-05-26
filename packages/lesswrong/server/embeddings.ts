import Posts from "../lib/collections/posts/collection";
import { PostEmbeddingsRepo } from "./repos";
import { forEachDocumentBatchInCollection } from "./manualMigrations/migrationUtils";
import { htmlToText } from "html-to-text";
import { Globals } from "./vulcan-lib";
import md5 from "md5";

const getEmbeddingsFromApi = async (text: string): Promise<number[]> => {
  const url = "http://localhost:8000/embeddings";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
    }),
  });
  const result = await response.json();
  if (result.error) {
    throw new Error(result.error);
  }
  if (!Array.isArray(result.embeddings)) {
    throw new Error(`Invalid API response: ${JSON.stringify(result)}`);
  }
  return result.embeddings;
}

const stripHtml = (html: string): string => htmlToText(html, {
  selectors: [
    {selector: "a", options: {ignoreHref: true}},
    {selector: "img", format: "skip"},
  ],
});

const getEmbeddingsForPost = async (postId: string): Promise<{
  hash: string,
  embeddings: number[],
}> => {
  const post = await Posts.findOne({_id: postId});
  if (!post) {
    throw new Error(`Can't find post with id ${postId}`);
  }
  const text = stripHtml(post.contents?.html ?? "");
  const embeddings = await getEmbeddingsFromApi(text);
  const hash = md5(text);
  return {hash, embeddings};
}

const updatePostEmbeddings = async (postId: string) => {
  const {hash, embeddings} = await getEmbeddingsForPost(postId);
  const repo = new PostEmbeddingsRepo();
  await repo.setPostEmbeddings(postId, hash, embeddings);
}

const updateAllPostEmbeddings = async () => {
  await forEachDocumentBatchInCollection({
    collection: Posts,
    batchSize: 20,
    callback: async (posts: DbPost[]) => {
      try {
        await Promise.all(posts.map(({_id}) => updatePostEmbeddings(_id)));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Error", e);
      }
    },
  });
}

Globals.updatePostEmbeddings = updatePostEmbeddings;
Globals.updateAllPostEmbeddings = updateAllPostEmbeddings;
