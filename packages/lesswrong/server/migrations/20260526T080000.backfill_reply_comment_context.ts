interface CommentContextFields {
  _id: string,
  parentCommentId: string | null,
  postId: string | null,
  tagId: string | null,
}

interface CommentContext {
  postId: string | null,
  tagId: string | null,
}

async function fetchCommentContext(db: MigrationContext["db"], commentId: string) {
  return await db.oneOrNone<CommentContextFields>(`
    SELECT "_id", "parentCommentId", "postId", "tagId"
    FROM "Comments"
    WHERE "_id" = $(commentId)
  `, { commentId });
}

async function getInheritedCommentContext(
  db: MigrationContext["db"],
  comment: CommentContextFields,
  commentsById: Map<string, CommentContextFields>,
): Promise<CommentContext | null> {
  const visitedCommentIds = new Set<string>([comment._id]);
  let parentCommentId = comment.parentCommentId;

  while (parentCommentId) {
    if (visitedCommentIds.has(parentCommentId)) return null;

    visitedCommentIds.add(parentCommentId);
    const parentComment = commentsById.get(parentCommentId) ?? await fetchCommentContext(db, parentCommentId);
    if (!parentComment) return null;

    commentsById.set(parentComment._id, parentComment);

    if (parentComment.postId || parentComment.tagId) {
      return {
        postId: parentComment.postId,
        tagId: parentComment.tagId,
      };
    }

    parentCommentId = parentComment.parentCommentId;
  }

  return null;
}

export const up = async ({db}: MigrationContext) => {
  const comments = await db.any<CommentContextFields>(`
    SELECT "_id", "parentCommentId", "postId", "tagId"
    FROM "Comments"
    WHERE "parentCommentId" IS NOT NULL
      AND "postId" IS NULL
      AND "tagId" IS NULL
  `);

  const commentsById = new Map(comments.map((comment) => [comment._id, comment]));

  for (const comment of comments) {
    const inheritedContext = await getInheritedCommentContext(db, comment, commentsById);
    if (!inheritedContext) continue;

    await db.none(`
      UPDATE "Comments"
      SET
        "postId" = $(postId),
        "tagId" = $(tagId)
      WHERE "_id" = $(commentId)
    `, {
      commentId: comment._id,
      postId: inheritedContext.postId,
      tagId: inheritedContext.tagId,
    });

    commentsById.set(comment._id, {
      ...comment,
      ...inheritedContext,
    });
  }
}

export const down = async ({db}: MigrationContext) => {
}
