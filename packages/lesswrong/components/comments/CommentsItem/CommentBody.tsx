import { useForumType } from '@/components/hooks/useForumType';
import React from 'react';
import classNames from 'classnames';
import { calculateTruncationStatus, commentExcerptFromHTML, truncate } from '../../../lib/editor/ellipsize'
import { llmRunGetPageUrl } from '@/lib/collections/llmRuns/helpers';
import { useLocation } from '@/lib/routeUtil';
import { useFilteredCurrentUser } from '../../common/withUser'
import { nofollowKarmaThreshold } from '@/lib/instanceSettings';
import ContentStyles from '../../common/ContentStyles';
import { VotingProps } from '../../votes/votingProps';
import { ContentItemBody } from '../../contents/ContentItemBody';
import { type ContentItemBodyImperative, type ContentReplacedSubstringComponentInfo } from '../../contents/contentBodyUtil';

import { getVotingSystemByName } from '../../../lib/voting/getVotingSystem';
import CommentDeletedMetadata from "./CommentDeletedMetadata";
import InlineReactSelectionWrapper from "../../votes/lwReactions/InlineReactSelectionWrapper";
import type { ContentStyleType } from '@/components/common/ContentStylesValues';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('CommentBody', (theme: ThemeType) => ({
  commentStyling: {
    maxWidth: "100%",
    overflowX: "hidden",
    overflowY: "hidden",
  },
  answerStyling: {
    maxWidth: "100%",
    overflowX: "hidden",
    overflowY: "hidden",
    '& .read-more-button a, & .read-more-button a:hover': {
      textShadow:"none",
      backgroundImage: "none"
    },
    marginBottom: ".5em"
  },
  root: {
    position: "relative",
    '& .read-more-button': {
      fontSize: ".85em",
      color: theme.palette.grey[600],
      cursor: "pointer",
    },
    '&& .llm-content-block': {
      margin: 0,
    },
    '& .llm-content-block[data-truncated] .llm-content-block-content::after, & .llm-content-block[data-truncated] .llm-content-block-content > p:last-child::after': {
      display: "none !important",
    },
  },
  retracted: {
    textDecoration: "line-through",
  },
}))

const LLM_REPLY_EXCERPT_WORD_LIMIT = 120;
const LLM_REPLY_EXPANDED_WORD_LIMIT = 480;
const LLM_REPLY_GRACE_WORDS = 20;

function truncateLlmReply(html: string, wordCount: number, wordLimit: number, readMoreLabel: (moreWords: string) => string): string {
  const { willTruncate, wordsRemaining } = calculateTruncationStatus(wordCount, wordLimit, LLM_REPLY_GRACE_WORDS);
  if (!willTruncate) {
    return html;
  }
  const moreWords = `${wordsRemaining.toLocaleString("en-US")} more words`;
  return truncate(html, wordLimit, "words", `... <span class="read-more-button">${readMoreLabel(moreWords)}</span>`);
}

function getLlmReplyHtml(html: string, wordCount: number, llmRunId: string, showExcerpt: boolean, pathname: string): string {
  if (showExcerpt) {
    return truncateLlmReply(html, wordCount, LLM_REPLY_EXCERPT_WORD_LIMIT, (moreWords) => `(${moreWords})`);
  }
  const runPageUrl = llmRunGetPageUrl(llmRunId);
  if (pathname === runPageUrl) {
    return html;
  }
  return truncateLlmReply(html, wordCount, LLM_REPLY_EXPANDED_WORD_LIMIT, (moreWords) => `<a href="${runPageUrl}">View full output (${moreWords})</a>`);
}

const CommentBody = ({comment, commentBodyRef, collapsed, truncated, postPage, voteProps, className}: {
  comment: CommentsList,
  commentBodyRef?: React.RefObject<ContentItemBodyImperative|null>|null,
  collapsed?: boolean,
  truncated?: boolean,
  postPage?: boolean,
  voteProps?: VotingProps<VoteableTypeClient>
  className?: string,
}) => {
  const { forumType } = useForumType();
  const classes = useStyles(styles);
  const { pathname } = useLocation();

  // Do not truncate for users who have disabled it in their user settings
  const truncationDisabledByUserConfig = useFilteredCurrentUser((u) => u && (postPage ? u.noCollapseCommentsPosts : u.noCollapseCommentsFrontpage));
  const { html = "", wordCount = 0 } = comment.contents || {}

  const bodyClasses = classNames(
    className,
    !comment.answer && classes.commentStyling,
    comment.answer && classes.answerStyling,
    comment.retracted && classes.retracted,
  );

  if (comment.deleted) { return <CommentDeletedMetadata documentId={comment._id}/> }
  if (collapsed) { return null }

  const showExcerpt = !!truncated && !truncationDisabledByUserConfig;
  let innerHtml: string;
  if (comment.llmRunId) {
    innerHtml = getLlmReplyHtml(html ?? '', wordCount, comment.llmRunId, showExcerpt, pathname);
  } else if (showExcerpt) {
    innerHtml = commentExcerptFromHTML(comment, postPage);
  } else {
    innerHtml = html ?? '';
  }

  let contentType: ContentStyleType;
  if (comment.answer) {
    contentType = 'answer';
  } else if (comment.debateResponse) {
    contentType = 'debateResponse';
  } else {
    contentType = 'comment';
  }
  
  const votingSystem = getVotingSystemByName(comment.votingSystem);
  let highlights: ContentReplacedSubstringComponentInfo[]|undefined = undefined;
  if (voteProps && votingSystem.getCommentHighlights) {
    highlights = votingSystem.getCommentHighlights({comment, voteProps});
  }

  const contentBody = <ContentStyles contentType={contentType} className={classes.root}>
    <ContentItemBody
      ref={commentBodyRef ?? undefined}
      className={bodyClasses}
      dangerouslySetInnerHTML={{__html: innerHtml }}
      description={`comment ${comment._id}`}
      nofollow={(comment.user?.karma || 0) < nofollowKarmaThreshold.get(forumType)}
      replacedSubstrings={highlights}
      contentStyleType={contentType}
    />
  </ContentStyles>

  if (votingSystem.hasInlineReacts && voteProps) {
    return <InlineReactSelectionWrapper contentRef={commentBodyRef} voteProps={voteProps} styling="comment" >
      {contentBody}
    </InlineReactSelectionWrapper>
  } else {
    return contentBody
  }
}

export default CommentBody;



