import PostRelations from "../../lib/collections/postRelations/collection";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";

class PostRelationsRepo extends AbstractRepo<"PostRelations"> {
  constructor() {
    super(PostRelations);
  }

  getPostRelationsByPostId(postId: string, depth = 3): Promise<DbPostRelation[]> {
    return this.any(`
      -- PostRelationsRepo.getPostRelationsByPostId
      WITH RECURSIVE search_tree(
        "_id", "createdAt", "type", "sourcePostId", "targetPostId", "order", "schemaVersion", "depth"
      ) AS (
        SELECT "_id", "createdAt", "type", "sourcePostId", "targetPostId", "order", "schemaVersion", 1 AS depth
        FROM "PostRelations"
        WHERE "sourcePostId" = $1
        UNION
        SELECT source."_id", source."createdAt", source."type", source."sourcePostId", source."targetPostId",
          source."order", source."schemaVersion", target.depth + 1 AS depth
        FROM "PostRelations" source
        JOIN search_tree target ON source."sourcePostId" = target."targetPostId" AND target.depth < $2
      )
      SELECT "_id", "createdAt", "type", "sourcePostId", "targetPostId", "order", "schemaVersion"
      FROM search_tree;
    `, [postId, depth]);
  }
}

recordPerfMetrics(PostRelationsRepo);

export default PostRelationsRepo;
