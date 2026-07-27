"use client";

import React, { useState } from "react";
import classNames from "classnames";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import {
  countAiDigestWords,
  formatAiDigestPostAuthors as formatPostAuthors,
  selectAiDigestExcerpt,
  truncateAiDigestText,
} from "@/lib/aiDigest/aiDigestDisplay";
import { aiDigestPresentation } from "@/lib/aiDigest/aiDigestPresentation";
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
import FormatDate from "@/components/common/FormatDate";
import ForumIcon from "@/components/common/ForumIcon";
import SectionTitle from "@/components/common/SectionTitle";
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
    marginTop: aiDigestPresentation.aiNote.marginTop,
    padding: aiDigestPresentation.aiNote.padding,
    borderRadius: aiDigestPresentation.aiNote.borderRadius,
    background: "light-dark(#e5eadc, #303a2f)",
  },
  aiNoteLabel: {
    marginBottom: aiDigestPresentation.aiNote.labelMarginBottom,
    color: "light-dark(#596650, #aab7a0)",
    // Matches emailSansFont in AiDigestEmail.tsx
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: aiDigestPresentation.aiNote.labelFontSize,
    fontWeight: aiDigestPresentation.aiNote.labelFontWeight,
    letterSpacing: aiDigestPresentation.aiNote.labelLetterSpacing,
    lineHeight: aiDigestPresentation.aiNote.labelLineHeight,
    textTransform: "uppercase",
  },
  aiNoteParagraph: {
    margin: aiDigestPresentation.aiNote.paragraphMargin,
    fontFamily: '"cronos-pro", "Trebuchet MS", Calibri, sans-serif',
    fontSize: aiDigestPresentation.aiNote.paragraphFontSize,
    lineHeight: aiDigestPresentation.aiNote.paragraphLineHeight,
    "&:first-of-type": {
      marginTop: 0,
    },
  },
  customPrompt: {
    marginTop: 14,
    padding: "15px 20px 16px",
    borderRadius: 6,
    background: theme.palette.panelBackground.darken05,
    color: theme.palette.text.dim2,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    lineHeight: 1.55,
  },
  customPromptLabel: {
    marginBottom: 6,
    color: theme.palette.text.dim3,
    fontSize: aiDigestPresentation.aiNote.labelFontSize,
    fontWeight: aiDigestPresentation.aiNote.labelFontWeight,
    letterSpacing: aiDigestPresentation.aiNote.labelLetterSpacing,
    lineHeight: aiDigestPresentation.aiNote.labelLineHeight,
    textTransform: "uppercase",
  },
  customPromptText: {
    fontStyle: "italic",
    whiteSpace: "pre-wrap",
  },
  customPromptToggle: {
    padding: 0,
    border: "none",
    background: "none",
    color: theme.palette.primary.main,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 13,
    "&:hover": {
      color: theme.palette.primary.dark,
    },
  },
  section: {
    marginTop: aiDigestPresentation.section.marginTop,
  },
  curatedTitle: {
    display: "flex",
    alignItems: "center",
    margin: 0,
    color: "light-dark(#8a8577, #a8a397)",
    fontSize: aiDigestPresentation.curated.labelFontSize,
    fontWeight: aiDigestPresentation.curated.labelFontWeight,
    letterSpacing: aiDigestPresentation.curated.labelLetterSpacing,
    lineHeight: aiDigestPresentation.curated.labelLineHeight,
    textTransform: "uppercase",
    "&:after": {
      content: '""',
      height: 1,
      flex: 1,
      marginLeft: aiDigestPresentation.curated.labelPaddingRight,
      background: "light-dark(#d8d1c0, #535049)",
    },
  },
  item: {
    marginTop: aiDigestPresentation.section.itemSpacing,
  },
  quietItemContainer: {
    marginTop: aiDigestPresentation.curated.itemPaddingTop,
  },
  quietItemFirstContainer: {
    marginTop: aiDigestPresentation.curated.firstItemPaddingTop,
  },
  card: {
    overflow: "hidden",
    borderRadius: aiDigestPresentation.card.borderRadius,
    background: "light-dark(#fffdf9, #2d2d2b)",
  },
  headlineImage: {
    display: "block",
    width: "100%",
    height: aiDigestPresentation.headline.imageHeight,
    objectFit: "cover",
  },
  headlineBody: {
    padding: aiDigestPresentation.headline.bodyPadding,
  },
  headlineTitle: {
    margin: aiDigestPresentation.headline.titleMargin,
    ...theme.typography.headerStyle,
    fontSize: aiDigestPresentation.headline.titleFontSize,
    fontWeight: aiDigestPresentation.headline.titleFontWeight,
    letterSpacing: aiDigestPresentation.headline.titleLetterSpacing,
    lineHeight: aiDigestPresentation.headline.titleLineHeight,
  },
  compactCard: {
    display: "grid",
    gridTemplateColumns: `minmax(0, 1fr) ${aiDigestPresentation.compact.imageWidth}px`,
  },
  compactWithoutImage: {
    gridTemplateColumns: "1fr",
  },
  compactBody: {
    minWidth: 0,
    padding: aiDigestPresentation.compact.textPadding,
  },
  compactImageWrap: {
    padding: aiDigestPresentation.compact.imagePadding,
  },
  compactImage: {
    display: "block",
    width: "100%",
    height: aiDigestPresentation.compact.imageHeight,
    borderRadius: aiDigestPresentation.compact.imageBorderRadius,
    objectFit: "cover",
  },
  compactTitle: {
    margin: aiDigestPresentation.compact.titleMargin,
    ...theme.typography.headerStyle,
    fontSize: aiDigestPresentation.compact.titleFontSize,
    fontWeight: aiDigestPresentation.compact.titleFontWeight,
    lineHeight: aiDigestPresentation.compact.titleLineHeight,
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
  metadataRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    color: theme.palette.text.dim3,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  headlineMetadata: {
    marginBottom: aiDigestPresentation.headline.metadataMarginBottom,
    fontSize: aiDigestPresentation.headline.metadataFontSize,
    lineHeight: aiDigestPresentation.headline.metadataLineHeight,
  },
  compactMetadata: {
    marginBottom: aiDigestPresentation.compact.metadataMarginBottom,
    fontSize: aiDigestPresentation.compact.metadataFontSize,
    lineHeight: 1.4,
  },
  metadataSeparator: {
    margin: "0 6px",
    color: theme.palette.text.dim4,
  },
  emphasizedMetadataAuthor: {
    color: theme.palette.text.normal,
    fontSize: aiDigestPresentation.discussion.bylineFontSize,
    fontWeight: aiDigestPresentation.discussion.bylineFontWeight,
  },
  permalink: {
    display: "inline-flex",
    alignItems: "center",
    marginLeft: 7,
    color: theme.palette.text.dim3,
    opacity: 0.72,
    textDecoration: "none",
    "&:hover": {
      color: theme.palette.primary.main,
      opacity: 1,
    },
    "&:focus-visible": {
      color: theme.palette.primary.main,
      opacity: 1,
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
      borderRadius: 2,
    },
  },
  permalinkIcon: {
    fontSize: 13,
  },
  excerpt: {
    margin: aiDigestPresentation.headline.excerptMargin,
    ...theme.typography.postStyle,
    fontSize: aiDigestPresentation.headline.excerptFontSize,
    lineHeight: aiDigestPresentation.headline.excerptLineHeight,
  },
  compactExcerpt: {
    margin: aiDigestPresentation.compact.excerptMargin,
    ...theme.typography.postStyle,
    fontSize: aiDigestPresentation.compact.excerptFontSize,
    lineHeight: aiDigestPresentation.compact.excerptLineHeight,
  },
  footer: {
    display: "flex",
    alignItems: "baseline",
    flexWrap: "wrap",
    columnGap: aiDigestPresentation.footer.columnGap,
    rowGap: aiDigestPresentation.footer.rowGap,
    paddingTop: aiDigestPresentation.footer.paddingTop,
    borderTop: "1px solid light-dark(#efe9dc, #4a4844)",
  },
  compactFooter: {
    gridColumn: "1 / -1",
    padding: aiDigestPresentation.compact.footerPadding,
  },
  readMore: {
    color: "light-dark(#5f9b65, #8bbf91)",
    flexShrink: 0,
    fontSize: aiDigestPresentation.footer.readLinkFontSize,
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },
  // Right of the read-more link on wide layouts; on narrow layouts it takes
  // its own flex line (full basis), left-aligned, with the footer rowGap above.
  reason: {
    minWidth: 0,
    flex: `1 1 ${aiDigestPresentation.footer.reasonFlexBasis}px`,
    color: theme.palette.text.dim3,
    fontSize: aiDigestPresentation.footer.reasonFontSize,
    fontStyle: "italic",
    lineHeight: aiDigestPresentation.footer.reasonLineHeight,
    textAlign: "right",
    textWrap: "balance",
    [theme.breakpoints.down("xs")]: {
      flexBasis: "100%",
      textAlign: "left",
    },
  },
  quickTakeBody: {
    padding: aiDigestPresentation.quickTake.bodyPadding,
  },
  quickTakeMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: aiDigestPresentation.quickTake.metaMarginBottom,
  },
  quickTakeMetadata: {
    minWidth: 0,
    fontSize: aiDigestPresentation.quickTake.dateFontSize,
    lineHeight: aiDigestPresentation.quickTake.labelLineHeight,
  },
  pill: {
    flexShrink: 0,
    padding: aiDigestPresentation.quickTake.labelPadding,
    borderRadius: aiDigestPresentation.quickTake.labelBorderRadius,
    background: "light-dark(#e5eadc, #303a2f)",
    color: "light-dark(#647259, #aab7a0)",
    fontSize: aiDigestPresentation.quickTake.labelFontSize,
    fontWeight: aiDigestPresentation.quickTake.labelFontWeight,
    lineHeight: aiDigestPresentation.quickTake.labelLineHeight,
    textTransform: "uppercase",
  },
  quickTakeText: {
    margin: aiDigestPresentation.quickTake.textMargin,
    fontSize: aiDigestPresentation.quickTake.textFontSize,
    lineHeight: aiDigestPresentation.quickTake.textLineHeight,
  },
  discussionBody: {
    padding: aiDigestPresentation.discussion.bodyPadding,
  },
  discussionThreadTitle: {
    margin: aiDigestPresentation.discussion.threadTitleMargin,
    ...theme.typography.postStyle,
    fontSize: aiDigestPresentation.discussion.threadTitleFontSize,
    fontStyle: "italic",
    fontWeight: aiDigestPresentation.discussion.threadTitleFontWeight,
    lineHeight: aiDigestPresentation.discussion.titleLineHeight,
  },
  discussionThreadTitleLink: {
    color: "light-dark(#4d4a43, #b3aea3)",
    textDecoration: "none",
    "&:hover": {
      color: theme.palette.primary.main,
    },
  },
  discussionThreadTitleSubject: {
    fontWeight: aiDigestPresentation.discussion.threadTitleSubjectFontWeight,
  },
  commentBox: {
    margin: aiDigestPresentation.discussion.commentMargin,
    padding: aiDigestPresentation.discussion.commentPadding,
    border: "1px solid light-dark(#e6dfd2, #4a4844)",
    borderRadius: aiDigestPresentation.discussion.commentBorderRadius,
    background: "light-dark(#ffffff, #252525)",
  },
  reply: {
    marginLeft: aiDigestPresentation.discussion.replyMarginLeft,
  },
  nestedReply: {
    marginLeft: aiDigestPresentation.discussion.nestedReplyMarginLeft,
  },
  commentByline: {
    marginBottom: aiDigestPresentation.discussion.bylineMarginBottom,
    fontSize: aiDigestPresentation.discussion.dateFontSize,
    lineHeight: aiDigestPresentation.discussion.titleLineHeight,
  },
  commentText: {
    fontSize: aiDigestPresentation.discussion.textFontSize,
    lineHeight: aiDigestPresentation.discussion.textLineHeight,
  },
  quietItem: {
    lineHeight: aiDigestPresentation.curated.itemLineHeight,
  },
  quietTitle: {
    ...theme.typography.headerStyle,
    color: theme.palette.text.normal,
    fontSize: aiDigestPresentation.curated.titleFontSize,
    fontWeight: aiDigestPresentation.curated.titleFontWeight,
    textDecoration: "none",
    "&:hover": {
      color: theme.palette.primary.main,
    },
  },
  // Greyed-out title for curated posts the reader has already read, matching
  // the read-state dimming of post items elsewhere onsite.
  quietTitleRead: {
    color: theme.palette.text.dim55,
  },
  quietAuthor: {
    marginLeft: aiDigestPresentation.curated.bylineMarginLeft,
    color: theme.palette.text.dim3,
    fontSize: aiDigestPresentation.curated.bylineFontSize,
  },
  missingItem: {
    padding: aiDigestPresentation.missingItem.padding,
    color: theme.palette.text.dim3,
    fontSize: aiDigestPresentation.missingItem.fontSize,
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

function getCommentPermalinkUrl(comment: AiDigestEmailComment): string {
  return commentGetPageUrlFromIds({
    postId: comment.post?._id,
    postSlug: comment.post?.slug,
    tagSlug: comment.tag?.slug,
    tagCommentType: comment.tagCommentType,
    commentId: comment._id,
    permalink: true,
    isAbsolute: false,
  });
}

interface ThreadTitle {
  // Rendered lighter than the subject it introduces, when there is one.
  prefix: string | null;
  subject: string;
}

function threadTitle(comment: AiDigestEmailComment): ThreadTitle {
  if (comment.shortform) {
    const author = comment.user?.displayName ?? "A LessWrong reader";
    return { prefix: null, subject: `${author}’s quick take` };
  }
  if (comment.post) {
    return { prefix: "Comments on", subject: `“${comment.post.title}”` };
  }
  if (comment.tag) {
    return { prefix: "Comments on", subject: comment.tag.name };
  }
  return { prefix: null, subject: "Comments" };
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

function ItemMetadata({
  author,
  postedAt,
  permalinkUrl,
  permalinkLabel,
  className,
  authorClassName,
}: {
  author: string;
  postedAt: string;
  permalinkUrl: string;
  permalinkLabel: string;
  className: string;
  authorClassName?: string;
}) {
  const classes = useStyles(styles);
  return (
    <div className={classNames(classes.metadataRow, className)}>
      <span className={authorClassName}>{author}</span>
      <span className={classes.metadataSeparator} aria-hidden="true">·</span>
      <FormatDate date={postedAt} />
      <a
        href={permalinkUrl}
        className={classes.permalink}
        aria-label={permalinkLabel}
        title="Permalink"
      >
        <ForumIcon icon="Link" className={classes.permalinkIcon} />
      </a>
    </div>
  );
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
        <a
          href={postUrl}
          className={classNames(classes.quietTitle, item.isRead && classes.quietTitleRead)}
        >
          {post.title}
        </a>
        <span className={classes.quietAuthor}>{formatPostAuthors(post)}</span>
      </div>
    );
  }

  if (item.placement === "compact") {
    const excerpt = selectAiDigestExcerpt(
      item.excerpt,
      post.contents?.plaintextDescription ?? "",
      aiDigestPresentation.excerptCharacters.compactPost,
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
          <ItemMetadata
            author={formatPostAuthors(post) || "A LessWrong author"}
            postedAt={post.postedAt}
            permalinkUrl={postUrl}
            permalinkLabel={`Permalink to ${post.title}`}
            className={classes.compactMetadata}
          />
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
    aiDigestPresentation.excerptCharacters.headlinePost,
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
        <ItemMetadata
          author={formatPostAuthors(post) || "A LessWrong author"}
          postedAt={post.postedAt}
          permalinkUrl={postUrl}
          permalinkLabel={`Permalink to ${post.title}`}
          className={classes.headlineMetadata}
        />
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
  const commentPermalinkUrl = getCommentPermalinkUrl(comment);
  const text = selectAiDigestExcerpt(
    item.excerpt,
    comment.contents?.plaintextMainText ?? "",
    aiDigestPresentation.excerptCharacters.fullQuickTake,
  );
  return (
    <article className={classes.card}>
      <div className={classes.quickTakeBody}>
        <div className={classes.quickTakeMeta}>
          <ItemMetadata
            author={comment.user?.displayName ?? "A LessWrong reader"}
            postedAt={comment.postedAt}
            permalinkUrl={commentPermalinkUrl}
            permalinkLabel="Permalink to this quick take"
            className={classes.quickTakeMetadata}
            authorClassName={classes.emphasizedMetadataAuthor}
          />
          <span className={classes.pill}>Quick take</span>
        </div>
        {text && (
          <a href={commentUrl} className={classes.textLink}>
            <p className={classes.quickTakeText}>{text}</p>
          </a>
        )}
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
  const commentUrl = getCommentUrl(comment);
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
      <ItemMetadata
        author={comment.user?.displayName ?? "A LessWrong reader"}
        postedAt={comment.postedAt}
        permalinkUrl={getCommentPermalinkUrl(comment)}
        permalinkLabel="Permalink to this comment"
        className={classes.commentByline}
        authorClassName={classes.emphasizedMetadataAuthor}
      />
      <a href={commentUrl} className={classes.textLink}>
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
  const { prefix, subject } = threadTitle(comment);
  return (
    <article className={classes.card}>
      <div className={classes.discussionBody}>
        <h3 className={classes.discussionThreadTitle}>
          <a href={commentUrl} className={classes.discussionThreadTitleLink}>
            {prefix ? `${prefix} ` : ""}
            <span className={classes.discussionThreadTitleSubject}>{subject}</span>
          </a>
        </h3>
        <CommentBox
          comment={comment}
          excerpt={item.excerpt}
          maxLength={aiDigestPresentation.excerptCharacters.discussionRoot}
        />
        {threadComments.map(({ comment: replyComment, excerpt, nestingLevel }) => (
          <CommentBox
            key={replyComment._id}
            comment={replyComment}
            excerpt={excerpt}
            maxLength={aiDigestPresentation.excerptCharacters.discussionReply}
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
  if (item.documentRef.documentType === "quickTake") {
    return <QuickTakeItem comment={comment} item={item} />;
  }
  return <DiscussionItem comment={comment} item={item} content={content} />;
}

function DigestSection({
  section,
  content,
}: {
  section: AiDigestSection;
  content: DigestContentLookup;
}) {
  const classes = useStyles(styles);
  // Recommendations sections render without a heading; specs stored before the
  // heading was removed still carry "Recommended for you", so drop it here too.
  const title = section.kind === "recommendations" ? undefined : section.title;
  return (
    <section className={classes.section}>
      {title && (section.kind === "curated"
        ? <div className={classes.curatedTitle}>{title}</div>
        : <SectionTitle title={title} noTopMargin noBottomPadding />)}
      {section.items.map((item, index) => (
        <div
          className={section.kind === "curated"
            ? classNames(
              classes.quietItemContainer,
              index === 0 && classes.quietItemFirstContainer,
            )
            : classes.item}
          key={itemKey(item)}
        >
          <DigestItem item={item} content={content} />
        </div>
      ))}
    </section>
  );
}

const CUSTOM_PROMPT_PREVIEW_LENGTH = 200;

function CustomPromptCard({ personalInstructions }: { personalInstructions: string }) {
  const classes = useStyles(styles);
  const [expanded, setExpanded] = useState(false);
  const preview = truncateAiDigestText(personalInstructions, CUSTOM_PROMPT_PREVIEW_LENGTH);
  const isTruncated = preview.length < personalInstructions.replace(/\s+/g, " ").trim().length;
  return (
    <div className={classes.customPrompt}>
      <div className={classes.customPromptLabel}>Your custom prompt</div>
      <span className={classes.customPromptText}>
        {expanded ? personalInstructions : preview}
      </span>
      {isTruncated && (
        <>
          {" "}
          <button
            type="button"
            className={classes.customPromptToggle}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "see less" : "see more"}
          </button>
        </>
      )}
    </div>
  );
}

export function AiDigestIssueView({
  spec,
  personalInstructions,
}: {
  spec: AiDigestSpec;
  personalInstructions?: string | null;
}) {
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
    return <p className={classes.error}>Could not load this content: {error.message}</p>;
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
        <div className={classes.aiNoteLabel}>AI Note · {spec.aiNote.modelName}</div>
        {spec.aiNote.paragraphs.map((paragraph, index) => (
          <p className={classes.aiNoteParagraph} key={index}>{paragraph}</p>
        ))}
      </aside>
      {personalInstructions && (
        <CustomPromptCard personalInstructions={personalInstructions} />
      )}
      {spec.sections.map((section) => (
        <DigestSection key={section.kind} section={section} content={content} />
      ))}
    </div>
  );
}
