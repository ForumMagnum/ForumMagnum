"use client";

import React from "react";
import classNames from "classnames";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import {
  countAiDigestWords,
  formatAiDigestDate,
  selectAiDigestExcerpt,
} from "@/lib/aiDigest/aiDigestDisplay";
import { gql } from "@/lib/generated/gql-codegen";
import type {
  AiDigestEmailComment,
  AiDigestEmailPost,
} from "@/lib/generated/gql-codegen/graphql";
import type {
  AiDigestItem,
  AiDigestSection,
  AiDigestSpec,
} from "@/server/emailComponents/AiDigestSpec";
import { useQuery } from "@/lib/crud/useQuery";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import Loading from "@/components/vulcan-core/Loading";

const AiDigestIssueContentQuery = gql(`
  query AiDigestIssueContent($postIds: [String!], $commentIds: [String!]) {
    posts(
      selector: { default: { exactPostIds: $postIds } }
      limit: 20
      enableTotal: false
    ) {
      results {
        ...AiDigestEmailPost
      }
    }
    comments(
      selector: { default: { commentIds: $commentIds } }
      limit: 40
      enableTotal: false
    ) {
      results {
        ...AiDigestEmailComment
      }
    }
  }
`);

const styles = defineStyles("AiDigestIssueView", (theme: ThemeType) => ({
  root: {
    color: theme.palette.text.normal,
  },
  aiNote: {
    marginBottom: 46,
    padding: "22px 26px 24px",
    border: theme.palette.border.faint,
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    borderRadius: 4,
    background: theme.palette.background.primaryTranslucent,
    [theme.breakpoints.down("xs")]: {
      padding: "18px 18px 20px",
    },
  },
  aiNoteLabel: {
    marginBottom: 10,
    color: theme.palette.primary.main,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.13em",
    textTransform: "uppercase",
  },
  aiNoteParagraph: {
    margin: "9px 0 0",
    fontFamily: '"cronos-pro", "Trebuchet MS", Calibri, sans-serif',
    fontSize: 16,
    lineHeight: 1.55,
    "&:first-of-type": {
      marginTop: 0,
    },
  },
  section: {
    marginTop: 44,
    "&:first-of-type": {
      marginTop: 0,
    },
  },
  sectionTitle: {
    margin: "0 0 18px",
    ...theme.typography.headerStyle,
    fontSize: 24,
    fontWeight: 500,
    lineHeight: 1.2,
  },
  curatedTitle: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    margin: "42px 0 16px",
    color: theme.palette.text.dim3,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    "&:after": {
      content: '""',
      height: 1,
      flex: 1,
      background: theme.palette.greyAlpha(0.16),
    },
  },
  item: {
    marginTop: 18,
    "&:first-of-type": {
      marginTop: 0,
    },
  },
  card: {
    overflow: "hidden",
    border: theme.palette.border.faint,
    borderRadius: 5,
    background: theme.palette.panelBackground.default,
    boxShadow: `0 10px 30px ${theme.palette.greyAlpha(0.05)}`,
  },
  headlineImage: {
    display: "block",
    width: "100%",
    height: 250,
    objectFit: "cover",
    [theme.breakpoints.down("xs")]: {
      height: 190,
    },
  },
  headlineBody: {
    padding: "24px 28px 26px",
    [theme.breakpoints.down("xs")]: {
      padding: "20px 20px 22px",
    },
  },
  headlineTitle: {
    margin: "0 0 7px",
    ...theme.typography.headerStyle,
    fontSize: 25,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    lineHeight: 1.18,
  },
  compactCard: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 142px",
    [theme.breakpoints.down("xs")]: {
      gridTemplateColumns: "minmax(0, 1fr) 94px",
    },
  },
  compactWithoutImage: {
    gridTemplateColumns: "1fr",
  },
  compactBody: {
    minWidth: 0,
    padding: "19px 22px 8px",
    [theme.breakpoints.down("xs")]: {
      padding: "16px 16px 7px",
    },
  },
  compactImageWrap: {
    padding: "18px 20px 10px 0",
    [theme.breakpoints.down("xs")]: {
      padding: "15px 14px 8px 0",
    },
  },
  compactImage: {
    display: "block",
    width: "100%",
    height: 90,
    borderRadius: 3,
    objectFit: "cover",
    [theme.breakpoints.down("xs")]: {
      height: 72,
    },
  },
  compactTitle: {
    margin: "0 0 4px",
    ...theme.typography.headerStyle,
    fontSize: 19,
    fontWeight: 500,
    lineHeight: 1.25,
  },
  titleLink: {
    color: theme.palette.text.normal,
    textDecoration: "none",
    "&:hover": {
      color: theme.palette.primary.main,
    },
  },
  textLink: {
    color: "inherit",
    textDecoration: "none",
  },
  byline: {
    marginBottom: 12,
    color: theme.palette.text.dim3,
    fontSize: 12.5,
    lineHeight: 1.4,
  },
  excerpt: {
    margin: "0 0 14px",
    ...theme.typography.postStyle,
    fontSize: 16,
    lineHeight: 1.55,
  },
  compactExcerpt: {
    margin: "8px 0 10px",
    ...theme.typography.postStyle,
    fontSize: 14,
    lineHeight: 1.48,
  },
  footer: {
    display: "flex",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: "5px 16px",
    paddingTop: 11,
    borderTop: theme.palette.border.faint,
  },
  compactFooter: {
    gridColumn: "1 / -1",
    padding: "0 22px 17px",
    [theme.breakpoints.down("xs")]: {
      padding: "0 16px 15px",
    },
  },
  readMore: {
    color: theme.palette.primary.main,
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },
  reason: {
    minWidth: 0,
    flex: "1 1 230px",
    color: theme.palette.text.dim3,
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 1.4,
    textAlign: "right",
    textWrap: "balance",
    [theme.breakpoints.down("xs")]: {
      textAlign: "left",
    },
  },
  quickTakeBody: {
    padding: "18px 22px 20px",
    [theme.breakpoints.down("xs")]: {
      padding: "16px",
    },
  },
  quickTakeMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 10,
  },
  quickTakeAuthor: {
    color: theme.palette.text.normal,
    fontSize: 13,
    fontWeight: 700,
  },
  date: {
    marginLeft: 8,
    color: theme.palette.text.dim3,
    fontSize: 12,
  },
  pill: {
    padding: "3px 8px",
    borderRadius: 20,
    background: theme.palette.background.primaryTranslucent,
    color: theme.palette.primary.dark,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  quickTakeText: {
    margin: "0 0 14px",
    fontSize: 15,
    lineHeight: 1.55,
  },
  discussionBody: {
    padding: "21px 24px 23px",
    [theme.breakpoints.down("xs")]: {
      padding: "17px 16px 19px",
    },
  },
  discussionTitle: {
    margin: "0 0 12px",
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  commentBox: {
    marginBottom: 10,
    padding: "13px 16px 15px",
    border: theme.palette.border.faint,
    borderRadius: 3,
    background: theme.palette.background.default,
  },
  reply: {
    marginLeft: 22,
    [theme.breakpoints.down("xs")]: {
      marginLeft: 12,
    },
  },
  nestedReply: {
    marginLeft: 40,
    [theme.breakpoints.down("xs")]: {
      marginLeft: 24,
    },
  },
  commentByline: {
    marginBottom: 5,
    fontSize: 13,
    fontWeight: 700,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 1.55,
  },
  quietItem: {
    padding: "5px 0",
    lineHeight: 1.4,
  },
  quietTitle: {
    ...theme.typography.headerStyle,
    color: theme.palette.text.normal,
    fontSize: 16,
    fontWeight: 500,
    textDecoration: "none",
    "&:hover": {
      color: theme.palette.primary.main,
    },
  },
  quietAuthor: {
    marginLeft: 8,
    color: theme.palette.text.dim3,
    fontSize: 12.5,
  },
  missingItem: {
    padding: "14px 0",
    color: theme.palette.text.dim3,
    fontSize: 13,
    fontStyle: "italic",
  },
  error: {
    color: theme.palette.error.main,
  },
}));

interface DigestContentLookup {
  postsById: Map<string, AiDigestEmailPost>;
  commentsById: Map<string, AiDigestEmailComment>;
}

interface DigestThreadComment {
  comment: AiDigestEmailComment;
  excerpt?: string;
  nestingLevel: number;
}

interface DigestThreadCommentCandidate {
  comment: AiDigestEmailComment;
  excerpt?: string;
}

function itemKey(item: AiDigestItem): string {
  return `${item.documentRef.documentType}:${item.documentRef.documentId}`;
}

function formatPostAuthors(post: AiDigestEmailPost): string {
  const primaryAuthor = post.user?.displayName;
  const coauthors = post.coauthors?.flatMap((author) =>
    author.displayName ? [author.displayName] : [],
  ) ?? [];
  return [primaryAuthor, ...coauthors].flatMap((author) => author ? [author] : []).join(", ");
}

function postReadMoreLabel(post: AiDigestEmailPost, displayedExcerpt: string): string {
  const wordCount = post.contents?.wordCount;
  if (!wordCount) {
    return "Read more";
  }
  const remainingWordCount = Math.max(0, wordCount - countAiDigestWords(displayedExcerpt));
  return remainingWordCount
    ? `Read more (${remainingWordCount.toLocaleString("en-US")} words)`
    : "Read more";
}

function getCommentUrl(comment: AiDigestEmailComment): string {
  return commentGetPageUrlFromIds({
    postId: comment.post?._id,
    postSlug: comment.post?.slug,
    tagSlug: comment.tag?.slug,
    tagCommentType: comment.tagCommentType,
    commentId: comment._id,
    isAbsolute: false,
  });
}

function threadTitle(comment: AiDigestEmailComment): string {
  if (comment.shortform) {
    return `${comment.user?.displayName ?? "A LessWrong reader"}’s quick take`;
  }
  if (comment.post) {
    return `Comments on “${comment.post.title}”`;
  }
  if (comment.tag) {
    return `Comments on ${comment.tag.name}`;
  }
  return "Comments";
}

function compareCommentsByDate(
  firstComment: DigestThreadCommentCandidate,
  secondComment: DigestThreadCommentCandidate,
): number {
  return new Date(firstComment.comment.postedAt).getTime()
    - new Date(secondComment.comment.postedAt).getTime();
}

function flattenThreadComments(
  parentCommentId: string,
  comments: DigestThreadCommentCandidate[],
  nestingLevel = 1,
): DigestThreadComment[] {
  const directReplies = comments
    .filter(({ comment }) => comment.parentCommentId === parentCommentId)
    .sort(compareCommentsByDate);
  const remainingComments = comments.filter(
    ({ comment }) => comment.parentCommentId !== parentCommentId,
  );
  return directReplies.flatMap(({ comment, excerpt }) => [
    { comment, excerpt, nestingLevel },
    ...flattenThreadComments(comment._id, remainingComments, nestingLevel + 1),
  ]);
}

function ItemFooter({
  url,
  label,
  reason,
}: {
  url: string;
  label: string;
  reason?: string;
}) {
  const classes = useStyles(styles);
  return (
    <div className={classes.footer}>
      <a href={url} className={classes.readMore}>{label}</a>
      {reason && <div className={classes.reason}>{reason}</div>}
    </div>
  );
}

function PostItem({ post, item }: { post: AiDigestEmailPost; item: AiDigestItem }) {
  const classes = useStyles(styles);
  const postUrl = postGetPageUrl(post);
  const imageUrl = post.socialPreviewData.imageUrl;

  if (item.placement === "quiet") {
    return (
      <div className={classes.quietItem}>
        <a href={postUrl} className={classes.quietTitle}>{post.title}</a>
        <span className={classes.quietAuthor}>{formatPostAuthors(post)}</span>
      </div>
    );
  }

  if (item.placement === "compact") {
    const excerpt = selectAiDigestExcerpt(
      item.excerpt,
      post.contents?.plaintextDescription ?? "",
      220,
    );
    return (
      <article
        className={classNames(
          classes.card,
          classes.compactCard,
          !imageUrl && classes.compactWithoutImage,
        )}
      >
        <div className={classes.compactBody}>
          <h3 className={classes.compactTitle}>
            <a href={postUrl} className={classes.titleLink}>{post.title}</a>
          </h3>
          <div className={classes.byline}>{formatPostAuthors(post)}</div>
          {excerpt && (
            <a href={postUrl} className={classes.textLink}>
              <p className={classes.compactExcerpt}>{excerpt}</p>
            </a>
          )}
        </div>
        {imageUrl && (
          <a href={postUrl} className={classes.compactImageWrap} aria-label={`Read ${post.title}`}>
            <img className={classes.compactImage} src={imageUrl} alt="" />
          </a>
        )}
        <div className={classes.compactFooter}>
          <ItemFooter
            url={postUrl}
            label={postReadMoreLabel(post, excerpt)}
            reason={item.reason}
          />
        </div>
      </article>
    );
  }

  const excerpt = selectAiDigestExcerpt(
    item.excerpt,
    post.contents?.plaintextDescription ?? "",
    520,
  );
  return (
    <article className={classes.card}>
      {imageUrl && (
        <a href={postUrl} aria-label={`Read ${post.title}`}>
          <img className={classes.headlineImage} src={imageUrl} alt="" />
        </a>
      )}
      <div className={classes.headlineBody}>
        <h2 className={classes.headlineTitle}>
          <a href={postUrl} className={classes.titleLink}>{post.title}</a>
        </h2>
        <div className={classes.byline}>{formatPostAuthors(post)}</div>
        {excerpt && (
          <a href={postUrl} className={classes.textLink}>
            <p className={classes.excerpt}>{excerpt}</p>
          </a>
        )}
        <ItemFooter
          url={postUrl}
          label={postReadMoreLabel(post, excerpt)}
          reason={item.reason}
        />
      </div>
    </article>
  );
}

function QuickTakeItem({
  comment,
  item,
}: {
  comment: AiDigestEmailComment;
  item: AiDigestItem;
}) {
  const classes = useStyles(styles);
  const commentUrl = getCommentUrl(comment);
  const text = selectAiDigestExcerpt(
    item.excerpt,
    comment.contents?.plaintextMainText ?? "",
    item.placement === "compact" ? 240 : 330,
  );
  return (
    <article className={classes.card}>
      <div className={classes.quickTakeBody}>
        <a href={commentUrl} className={classes.textLink}>
          <div className={classes.quickTakeMeta}>
            <div>
              <span className={classes.quickTakeAuthor}>
                {comment.user?.displayName ?? "A LessWrong reader"}
              </span>
              <span className={classes.date}>{formatAiDigestDate(comment.postedAt)}</span>
            </div>
            <span className={classes.pill}>Quick take</span>
          </div>
          {text && <p className={classes.quickTakeText}>{text}</p>}
        </a>
        <ItemFooter url={commentUrl} label="Read more" reason={item.reason} />
      </div>
    </article>
  );
}

function CommentBox({
  comment,
  excerpt,
  maxLength,
  nestingLevel = 0,
}: {
  comment: AiDigestEmailComment;
  excerpt?: string;
  maxLength: number;
  nestingLevel?: number;
}) {
  const classes = useStyles(styles);
  const text = selectAiDigestExcerpt(
    excerpt,
    comment.contents?.plaintextMainText ?? "",
    maxLength,
  );
  return (
    <div
      className={classNames(
        classes.commentBox,
        nestingLevel === 1 && classes.reply,
        nestingLevel >= 2 && classes.nestedReply,
      )}
    >
      <a href={getCommentUrl(comment)} className={classes.textLink}>
        <div className={classes.commentByline}>
          {comment.user?.displayName ?? "A LessWrong reader"}
          <span className={classes.date}>{formatAiDigestDate(comment.postedAt)}</span>
        </div>
        <div className={classes.commentText}>{text}</div>
      </a>
    </div>
  );
}

function DiscussionItem({
  comment,
  item,
  content,
}: {
  comment: AiDigestEmailComment;
  item: AiDigestItem;
  content: DigestContentLookup;
}) {
  const classes = useStyles(styles);
  const commentUrl = getCommentUrl(comment);
  const candidateThreadComments = (item.threadComments ?? []).flatMap(({ commentId, excerpt }) => {
    const threadComment = content.commentsById.get(commentId);
    return threadComment ? [{ comment: threadComment, excerpt }] : [];
  });
  const threadComments = flattenThreadComments(comment._id, candidateThreadComments);
  return (
    <article className={classes.card}>
      <div className={classes.discussionBody}>
        <h3 className={classes.discussionTitle}>
          <a href={commentUrl} className={classes.titleLink}>{threadTitle(comment)}</a>
        </h3>
        <CommentBox comment={comment} excerpt={item.excerpt} maxLength={720} />
        {threadComments.map(({ comment: replyComment, excerpt, nestingLevel }) => (
          <CommentBox
            key={replyComment._id}
            comment={replyComment}
            excerpt={excerpt}
            maxLength={360}
            nestingLevel={nestingLevel}
          />
        ))}
        <ItemFooter url={commentUrl} label="View thread" reason={item.reason} />
      </div>
    </article>
  );
}

function DigestItem({
  item,
  content,
}: {
  item: AiDigestItem;
  content: DigestContentLookup;
}) {
  const classes = useStyles(styles);
  if (item.documentRef.documentType === "post") {
    const post = content.postsById.get(item.documentRef.documentId);
    return post
      ? <PostItem post={post} item={item} />
      : <div className={classes.missingItem}>This post is no longer available.</div>;
  }

  const comment = content.commentsById.get(item.documentRef.documentId);
  if (!comment) {
    return <div className={classes.missingItem}>This discussion item is no longer available.</div>;
  }
  return item.documentRef.documentType === "quickTake"
    ? <QuickTakeItem comment={comment} item={item} />
    : <DiscussionItem comment={comment} item={item} content={content} />;
}

function DigestSection({
  section,
  content,
}: {
  section: AiDigestSection;
  content: DigestContentLookup;
}) {
  const classes = useStyles(styles);
  return (
    <section className={classes.section}>
      {section.kind === "curated"
        ? <div className={classes.curatedTitle}>{section.title}</div>
        : <h2 className={classes.sectionTitle}>{section.title}</h2>}
      {section.items.map((item) => (
        <div className={classes.item} key={itemKey(item)}>
          <DigestItem item={item} content={content} />
        </div>
      ))}
    </section>
  );
}

export function AiDigestIssueView({ spec }: { spec: AiDigestSpec }) {
  const classes = useStyles(styles);
  const items = spec.sections.flatMap((section) => section.items);
  const postIds = items.flatMap((item) =>
    item.documentRef.documentType === "post" ? [item.documentRef.documentId] : [],
  );
  const commentIds = items.flatMap((item) => [
    ...(item.documentRef.documentType === "post" ? [] : [item.documentRef.documentId]),
    ...(item.threadComments ?? []).map(({ commentId }) => commentId),
  ]);
  const { data, loading, error } = useQuery(AiDigestIssueContentQuery, {
    variables: { postIds, commentIds },
    ssr: false,
  });

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return <p className={classes.error}>Could not load this edition: {error.message}</p>;
  }

  const posts = data?.posts?.results ?? [];
  const comments = data?.comments?.results ?? [];
  const content: DigestContentLookup = {
    postsById: new Map(posts.map((post) => [post._id, post])),
    commentsById: new Map(comments.map((comment) => [comment._id, comment])),
  };

  return (
    <div className={classes.root}>
      <aside className={classes.aiNote}>
        <div className={classes.aiNoteLabel}>From the AI assistant · {spec.aiNote.modelName}</div>
        {spec.aiNote.paragraphs.map((paragraph, index) => (
          <p className={classes.aiNoteParagraph} key={index}>{paragraph}</p>
        ))}
      </aside>
      {spec.sections.map((section) => (
        <DigestSection key={section.kind} section={section} content={content} />
      ))}
    </div>
  );
}
