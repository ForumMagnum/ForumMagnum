"use client";

import React, { useState } from 'react';
import classNames from 'classnames';
import { Link } from '@/lib/reactRouterWrapper';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { commentGetPageUrl } from '@/lib/collections/comments/helpers';
import UsersNameDisplay from '@/components/users/UsersNameDisplay';
import FormatDate from '@/components/common/FormatDate';
import ContentStyles from '@/components/common/ContentStyles';
import { ContentItemBody } from '@/components/contents/ContentItemBody';

export type ActivityItem =
  | { kind: 'post'; post: PostsList; postedAt: Date; baseScore: number }
  | { kind: 'comment'; comment: CommentsListWithParentMetadata; postedAt: Date; baseScore: number };

const styles = defineStyles('ActivityListItem', (theme: ThemeType) => ({
  row: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    lineHeight: 1.45,
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.08)}`,
    transition: 'background-color 120ms ease',
  },
  rowExpanded: {
    background: theme.palette.greyAlpha(0.025),
  },
  summary: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    padding: '6px 8px 6px 0',
    minWidth: 0,
    cursor: 'pointer',
    '&:hover $caret': {
      color: theme.palette.greyAlpha(0.55),
    },
    '&:hover $postTitle': {
      color: theme.palette.primary.main,
    },
  },
  karma: {
    flex: '0 0 32px',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 600,
    fontSize: 13,
    color: theme.palette.greyAlpha(0.7),
  },
  karmaPositive: {
    color: theme.palette.primary.main,
  },
  karmaNegative: {
    color: theme.palette.greyAlpha(0.4),
  },
  content: {
    flex: '1 1 auto',
    minWidth: 0,
    overflow: 'hidden',
  },
  caret: {
    flex: '0 0 14px',
    width: 14,
    fontSize: 11,
    color: theme.palette.greyAlpha(0.25),
    userSelect: 'none',
    transition: 'color 120ms ease, transform 120ms ease',
  },
  caretExpanded: {
    transform: 'rotate(90deg)',
    color: theme.palette.greyAlpha(0.55),
  },
  singleLine: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  postTitle: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 1.3,
    color: theme.palette.greyAlpha(0.9),
    transition: 'font-size 220ms ease, line-height 220ms ease, color 120ms ease',
  },
  postTitleExpanded: {
    // Larger than display2 (36.4px), which is the size of an h1 inside a post body
    fontSize: 44,
    lineHeight: 1.1,
    whiteSpace: 'normal',
    overflow: 'visible',
    textOverflow: 'clip',
  },
  postExcerpt: {
    marginTop: 1,
    fontSize: 13,
    lineHeight: 1.4,
    color: theme.palette.greyAlpha(0.55),
    maxHeight: 22,
    opacity: 1,
    overflow: 'hidden',
    transition: 'max-height 220ms ease, opacity 180ms ease, margin-top 220ms ease',
  },
  postExcerptHidden: {
    maxHeight: 0,
    opacity: 0,
    marginTop: 0,
  },
  commentParent: {
    fontSize: 13,
    lineHeight: 1.45,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  commentParentPrefix: {
    color: theme.palette.greyAlpha(0.45),
    marginRight: 4,
  },
  commentParentLink: {
    color: theme.palette.greyAlpha(0.95),
    fontWeight: 600,
    '&:hover': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
    },
  },
  commentBody: {
    marginTop: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 13,
    lineHeight: 1.45,
    color: theme.palette.greyAlpha(0.65),
  },
  emptyExcerpt: {
    color: theme.palette.greyAlpha(0.3),
    fontStyle: 'italic',
  },
  meta: {
    flex: '0 0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 1,
    fontSize: 12,
    color: theme.palette.greyAlpha(0.5),
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.4,
  },
  metaPrimary: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
  },
  metaSeparator: {
    color: theme.palette.greyAlpha(0.25),
  },
  author: {
    color: theme.palette.greyAlpha(0.65),
  },
  metaContext: {
    fontSize: 11,
    maxWidth: 220,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: theme.palette.greyAlpha(0.4),
  },
  metaContextLink: {
    color: 'inherit',
    '&:hover': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
    },
  },
  expandedSection: {
    paddingLeft: 42,
    paddingRight: 16,
    paddingTop: 4,
    paddingBottom: 14,
  },
  expandedBody: {
    fontSize: 14,
    color: theme.palette.greyAlpha(0.85),
    '& p': {
      margin: '0 0 0.6em',
    },
    '& p:last-child': {
      marginBottom: 0,
    },
  },
  expandedFooter: {
    marginTop: 10,
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 12,
    fontSize: 12,
  },
  permalink: {
    color: theme.palette.primary.main,
    fontWeight: 500,
    letterSpacing: '0.01em',
    '&:hover': {
      textDecoration: 'none',
      color: theme.palette.primary.dark,
    },
  },
  emptyContent: {
    fontSize: 13,
    fontStyle: 'italic',
    color: theme.palette.greyAlpha(0.5),
  },
}));

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function stopPropagation(event: React.MouseEvent) {
  event.stopPropagation();
}

const ActivityListItem = ({ item }: { item: ActivityItem }) => {
  const classes = useStyles(styles);
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => setExpanded(prev => !prev);

  const karmaClass = item.baseScore > 0
    ? classes.karmaPositive
    : item.baseScore < 0
      ? classes.karmaNegative
      : undefined;

  if (item.kind === 'post') {
    const { post, postedAt, baseScore } = item;
    const url = postGetPageUrl(post);
    const title = post.title || '(untitled)';
    const excerpt = normalizeWhitespace(post.contents?.plaintextDescription ?? '');
    const expandedHtml = post.contents?.htmlHighlight ?? '';
    return (
      <div className={classNames(classes.row, expanded && classes.rowExpanded)}>
        <div
          className={classes.summary}
          onClick={toggleExpanded}
          role="button"
          aria-expanded={expanded}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpanded(); } }}
        >
          <span className={classNames(classes.karma, karmaClass)}>{baseScore}</span>
          <div className={classes.content}>
            <div className={classNames(classes.postTitle, !expanded && classes.singleLine, expanded && classes.postTitleExpanded)}>{title}</div>
            <div className={classNames(classes.postExcerpt, classes.singleLine, !excerpt && classes.emptyExcerpt, expanded && classes.postExcerptHidden)}>
              {excerpt || 'No preview available'}
            </div>
          </div>
          <div className={classes.meta} onClick={stopPropagation}>
            <div className={classes.metaPrimary}>
              <span className={classes.author}><UsersNameDisplay user={post.user} /></span>
              <span className={classes.metaSeparator}>·</span>
              <FormatDate date={postedAt} />
            </div>
          </div>
          <span className={classNames(classes.caret, expanded && classes.caretExpanded)} aria-hidden="true">›</span>
        </div>
        {expanded && (
          <div className={classes.expandedSection} onClick={stopPropagation}>
            {expandedHtml ? (
              <ContentStyles contentType="postHighlight" className={classes.expandedBody}>
                <ContentItemBody dangerouslySetInnerHTML={{ __html: expandedHtml }} description={`post ${post._id}`} />
              </ContentStyles>
            ) : (
              <div className={classes.emptyContent}>No preview available for this post.</div>
            )}
            <div className={classes.expandedFooter}>
              <Link to={url} className={classes.permalink}>Read full post →</Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  const { comment, postedAt, baseScore } = item;
  const commentText = normalizeWhitespace(comment.contents?.plaintextMainText ?? '') || '(empty comment)';
  const url = commentGetPageUrl(comment);
  const parentTitle = comment.post?.title ?? comment.tag?.name ?? '';
  const parentUrl = comment.post
    ? postGetPageUrl(comment.post)
    : comment.tag
      ? `/w/${comment.tag.slug}`
      : null;
  const expandedHtml = comment.contents?.html ?? '';

  return (
    <div className={classNames(classes.row, expanded && classes.rowExpanded)}>
      <div
        className={classes.summary}
        onClick={toggleExpanded}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpanded(); } }}
      >
        <span className={classNames(classes.karma, karmaClass)}>{baseScore}</span>
        <div className={classes.content}>
          {parentTitle && parentUrl && (
            <div className={classes.commentParent}>
              <span className={classes.commentParentPrefix}>on</span>
              <Link to={parentUrl} className={classes.commentParentLink} onClick={stopPropagation}>{parentTitle}</Link>
            </div>
          )}
          <div className={classes.commentBody}>{commentText}</div>
        </div>
        <div className={classes.meta} onClick={stopPropagation}>
          <div className={classes.metaPrimary}>
            <span className={classes.author}><UsersNameDisplay user={comment.user} /></span>
            <span className={classes.metaSeparator}>·</span>
            <FormatDate date={postedAt} />
          </div>
        </div>
        <span className={classNames(classes.caret, expanded && classes.caretExpanded)} aria-hidden="true">›</span>
      </div>
      {expanded && (
        <div className={classes.expandedSection} onClick={stopPropagation}>
          {expandedHtml ? (
            <ContentStyles contentType="comment" className={classes.expandedBody}>
              <ContentItemBody dangerouslySetInnerHTML={{ __html: expandedHtml }} description={`comment ${comment._id}`} />
            </ContentStyles>
          ) : (
            <div className={classes.emptyContent}>(empty comment)</div>
          )}
          <div className={classes.expandedFooter}>
            <Link to={url} className={classes.permalink}>View comment →</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityListItem;
