import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { fetchFragment } from "../fetchFragment";
import { getSqlClientOrThrow } from "../sql/sqlClient";
import { createAnonymousContext, Globals } from "../vulcan-lib";
import { writeFile } from "fs/promises";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import { htmlToTextDefault } from "@/lib/htmlToText";

type DateFieldOf<T> = {
  [k in keyof T & string]: IfAny<T[k], never, T[k] extends Date | null ? k : never>;
}[keyof T & string];

interface CreateAEPostRecordArgs {
  post: DbPost & {contents: EditableFieldContents | null};
  tags: {
    _id: string;
    name: string;
    core: boolean;
  }[];
  authors?: string[];
  upvoteCount?: number;
}

function getNextOffsetDate<T extends HasCreatedAtType, O extends DateFieldOf<T>>(currentOffsetDate: Date, batch: T[], offsetField?: O) {
  const nextOffsetDate = batch.slice(-1)[0][offsetField ?? 'createdAt'] as Date;
  if (currentOffsetDate.getTime() === nextOffsetDate.getTime()) {
    // eslint-disable-next-line no-console
    console.log(`Next batch offset date is the same as previous offset date: ${currentOffsetDate.toISOString()}.  If this seems like an early return, investigate!`);
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`Next batch offset date: ${nextOffsetDate.toISOString()}`);

  return nextOffsetDate;
}

const postBatchQuery = `
  WITH selected_posts AS (
    SELECT
      p._id,
      p."userId",
      p."coauthorStatuses"
    FROM "Posts" AS p
    WHERE p.draft IS NOT TRUE
      AND p."isFuture" IS FALSE
      AND p."unlisted" IS NOT TRUE
      AND p.rejected IS NOT TRUE
      AND p."hiddenRelatedQuestion" IS NOT TRUE
      AND p."groupId" IS NULL
      AND p.shortform IS NOT TRUE
      AND ((p."authorIsUnreviewed" IS NOT TRUE) OR (p."reviewedByUserId" IS NOT NULL))
      AND p.status = 2
      AND p."createdAt" >= $1
    ORDER BY p."createdAt" ASC
    LIMIT $2
  ), authorships AS ((
    SELECT
      _id,
      "userId"
    FROM
    selected_posts
  )
  UNION ALL (
    SELECT
      _id,
      unnest("coauthorStatuses") ->> 'userId' AS "userId"
    FROM selected_posts
  ))
  SELECT
    p.*,
    ROW_TO_JSON(r.*) AS "contents",
    CASE WHEN COUNT(t.*) = 0
      THEN '{}'::JSONB[]
      ELSE ARRAY_AGG(JSONB_BUILD_ARRAY(t._id, t.name, t.core))
    END AS tags,
    (SELECT ARRAY_AGG(COALESCE(u."displayName", u."username")) FROM "Users" AS u WHERE u._id IN (SELECT "userId" FROM authorships WHERE authorships._id = p._id)) AS authors,
    ARRAY_AGG(DISTINCT authorships."userId") AS "authorIds",
    (SELECT COUNT(*) FROM "Votes" AS v WHERE v."documentId" = p._id AND v.cancelled IS NOT TRUE AND v.power > 0 AND v."userId" NOT IN (SELECT "userId" FROM authorships WHERE authorships._id = p._id)) AS "upvoteCount"
  FROM authorships
  INNER JOIN "Posts" AS p
  USING(_id)
  JOIN "Revisions" AS r
  ON p."contents_latest" = r."_id"
  LEFT JOIN "TagRels" AS tr
  ON authorships._id = tr."postId"
  LEFT JOIN "Tags" AS t
  ON tr."tagId" = t._id
  GROUP BY p._id, r._id
  ORDER BY p."createdAt" ASC
`;

async function getCommentBatch(offsetDate: Date, context: ResolverContext) {
  const db = getSqlClientOrThrow();
  const limit = 50_000;

  const batch = await fetchFragment({
    collectionName: 'Comments',
    fragmentName: 'CommentsListWithParentMetadata',
    currentUser: null,
    context,
    selector: { postedAt: { $gt: offsetDate }, postId: { $exists: true } },
    options: { sort: { postedAt: 1 }, limit },
  });

  const commentsWithPublicPosts = batch.filter(c => c.postId && !c.post);

  return commentsWithPublicPosts;
}

function getPostBatch(offsetDate: Date) {
  const db = getSqlClientOrThrow();
  const limit = 5_000;
  return db.any<DbPost & {
    tags: [tagId: string, tagName: string, core: boolean][],
    authors: string[],
    authorIds: string[],
    upvoteCount: number,
    contents: EditableFieldContents | null,
  }>(postBatchQuery, [offsetDate, limit]);
}

function createAEPostRecord({ post, tags, authors, upvoteCount }: CreateAEPostRecordArgs) {
  const tagNames = filterNonnull(tags.map(tag => tag.name));
  const postText = htmlToTextDefault(post.contents?.html);

  return {
    _id: post._id,
    title: post.title,
    authors,
    score: post.score,
    karma: post.baseScore,
    body: postText,
    postedAt: post.postedAt,
    tags: tagNames,
    commentCount: post.commentCount,
    upvoteCount,
    url: `https://www.lesswrong.com/posts/${post._id}/${post.slug}`
  };
}

async function exportAECommentRecords(offsetDate?: Date) {
  const db = getSqlClientOrThrow();
  const context = createAnonymousContext();

  if (!offsetDate) {
    const { postedAt: earliestCommentPostedAt } = await db.one<{ postedAt: Date }>('SELECT MIN("postedAt") AS "postedAt" FROM "Comments"');
    offsetDate = new Date(earliestCommentPostedAt.getTime() - 1);
  }

  // eslint-disable-next-line no-console
  console.log(`Initial post batch offset date: ${offsetDate.toISOString()}`);

  let batch = await getCommentBatch(offsetDate, context);

  try {
    while (batch.length) {
      // eslint-disable-next-line no-console
      console.log(`Post batch size: ${batch.length}.`);

      const commentsWithMetadata = batch.map((comment) => {
        const { _id, user, postId, contents, parentCommentId, baseScore: karma, postedAt, answer } = comment;

        return {
          _id,
          user: {
            _id: user?._id,
            displayName: userGetDisplayName(comment.user),
          },
          htmlBody: contents?.html,
          postId,
          parentCommentId,
          baseScore: karma,
          answer,
          postedAt,
        };
      });

      await writeFile(`./aestudios/lw_comments_${offsetDate.toISOString()}.json`, JSON.stringify(commentsWithMetadata));

      const nextOffsetDate: Date | undefined = getNextOffsetDate(offsetDate, batch, 'postedAt');
      if (!nextOffsetDate) {
        return;
      }
      offsetDate = nextOffsetDate;
      batch = await getCommentBatch(offsetDate, context);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`Error when exporting AE Studio post records.  Last offset date: ${offsetDate.toISOString()}`, { err });
  }
}

async function exportAEPostRecords(offsetDate?: Date) {
  const db = getSqlClientOrThrow();

  if (!offsetDate) {
    ({ offsetDate } = await db.one<{ offsetDate: Date }>('SELECT MIN("createdAt") AS "offsetDate" FROM "Posts"'));
  }

  // eslint-disable-next-line no-console
  console.log(`Initial post batch offset date: ${offsetDate.toISOString()}`);

  let batch = await getPostBatch(offsetDate);

  try {
    while (batch.length) {
      // eslint-disable-next-line no-console
      console.log(`Post batch size: ${batch.length}.`);

      const postsWithMetadata = batch.map(({ tags, authors, authorIds, upvoteCount, ...post }) => ({
        post,
        tags: filterNonnull(tags.map(([_id, name, core]) => ({ _id, name, core }))),
        authors,
        authorIds,
        upvoteCount,
      }));

      const postRecords = postsWithMetadata.map(createAEPostRecord);

      await writeFile(`./aestudios/lw_posts_${offsetDate.toISOString()}.json`, JSON.stringify(postRecords));

      const nextOffsetDate: Date | undefined = getNextOffsetDate(offsetDate, batch);
      if (!nextOffsetDate) {
        return;
      }
      offsetDate = nextOffsetDate;
      batch = await getPostBatch(offsetDate);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(`Error when exporting AE Studio post records.  Last offset date: ${offsetDate.toISOString()}`, { err });
  }
}

Globals.exportAEComments = exportAECommentRecords;
Globals.exportAEPosts = exportAEPostRecords;
