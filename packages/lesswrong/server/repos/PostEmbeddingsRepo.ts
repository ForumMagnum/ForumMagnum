import AbstractRepo from "./AbstractRepo";
import PostEmbeddings from "../../lib/collections/postEmbeddings/collection";
import { randomId } from "../../lib/random";
import { recordPerfMetrics } from "./perfMetricWrapper";

class PostEmbeddingsRepo extends AbstractRepo<"PostEmbeddings"> {
  constructor() {
    super(PostEmbeddings);
  }

  setPostEmbeddings(
    postId: string,
    postHash: string,
    model: string,
    embeddings: number[],
  ): Promise<null> {
    if (!Array.isArray(embeddings) || embeddings.length < 1) {
      throw new Error("Cannot create post embeddings with empty array");
    }
    const now = new Date();
    return this.none(`
      -- PostEmbeddingsRepo.setPostEmbeddings
      INSERT INTO "PostEmbeddings" (
        "_id",
        "postId",
        "postHash",
        "lastGeneratedAt",
        "embeddings",
        "model",
        "createdAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $4
      ) ON CONFLICT ("postId", "model") DO UPDATE SET
        "postHash" = $3,
        "lastGeneratedAt" = $4,
        "embeddings" = $5
    `, [randomId(), postId, postHash, now, JSON.stringify(embeddings), model]);
  }
}

recordPerfMetrics(PostEmbeddingsRepo);

export default PostEmbeddingsRepo;
