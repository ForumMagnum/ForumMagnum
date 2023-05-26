import AbstractRepo from "./AbstractRepo";
import PostEmbeddings from "../../lib/collections/postEmbeddings/collection";
import { randomId } from "../../lib/random";

export default class PostEmbeddingsRepo extends AbstractRepo<DbPostEmbedding> {
  constructor() {
    super(PostEmbeddings);
  }

  setPostEmbeddings(
    postId: string,
    postHash: string,
    embeddings: number[],
  ): Promise<null> {
    const now = new Date();
    return this.none(`
      INSERT INTO "PostEmbeddings" (
        "_id", "postId", "postHash", "lastGeneratedAt", "embeddings", "createdAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $4
      ) ON CONFLICT ("postId") DO UPDATE SET
        "postHash" = $3,
        "lastGeneratedAt" = $4,
        "embeddings" = $5
    `, [randomId(), postId, postHash, now, embeddings]);
  }
}
