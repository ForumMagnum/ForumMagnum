import { useForumType } from '@/components/hooks/useForumType';
import React from 'react';
import classNames from 'classnames';
import { commentExcerptFromHTML, getTruncationCharCount, truncate } from '../../../lib/editor/ellipsize'
import { llmRunGetPageUrl } from '@/lib/collections/llmRuns/helpers';
import { useLocation } from '@/lib/routeUtil';
import { escapeHtml } from '@/lib/utils/sanitize';
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
    // A model reply is all one LLM content block, so it needs none of the
    // spacing that sets a block apart from a post's other text
    '&& .llm-content-block': {
      margin: 0,
    },
    // The end mark means the model's text ends here, so a cut-off reply has none
    '& .llm-content-block:has(.read-more-button) .llm-content-block-content::after, & .llm-content-block:has(.read-more-button) .llm-content-block-content > p:last-child::after': {
      display: "none !important",
    },
  },
  retracted: {
    textDecoration: "line-through",
  },
}))

/**
 * Expanding a truncated model reply ("(read more)") shows up to this many times
 * the length of the usual comment excerpt
 */
const LLM_REPLY_EXPANDED_LENGTH_MULTIPLE = 4;

const STYLE_TAG_PATTERN = /<style[\s\S]*?<\/style>/g;

/**
 * A finished model reply, shown as an LLM content block: the model's font,
 * its version label and the end mark. The writing and failure notices are
 * LessWrong's words, not the model's; they link to the run page, which is how
 * they're told apart, and are left as they are.
 */
function wrapLlmReply(comment: CommentsList, html: string): string {
  const modelName = comment.llmRun?.modelName;
  const commentHtml = comment.contents?.html ?? "";
  if (!comment.llmRunId || !modelName || commentHtml.includes(llmRunGetPageUrl(comment.llmRunId)) || commentHtml.includes("llm-content-block")) {
    return html;
  }
  // Style tags (e.g. MathJax's) go before the block, so that the model label
  // stays inline with the first paragraph
  const styleTags = html.match(STYLE_TAG_PATTERN)?.join("") ?? "";
  const body = html.replace(STYLE_TAG_PATTERN, "");
  return `${styleTags}<div class="llm-content-block" data-model-name="${escapeHtml(modelName)}"><div class="llm-content-block-content">${body}</div></div>`;
}

/**
 * A model reply that has been expanded is still cut off past a few times the
 * usual excerpt length, with "View full output" linking to its run page. Null
 * for everything else, and on that run page itself, which shows the reply in
 * full.
 */
function getLlmReplyExcerpt(comment: CommentsList, postPage: boolean | undefined, pathname: string): string | null {
  const html = comment.contents?.html;
  if (!comment.llmRunId || !html) {
    return null;
  }
  const runPageUrl = llmRunGetPageUrl(comment.llmRunId);
  const maxLength = LLM_REPLY_EXPANDED_LENGTH_MULTIPLE * getTruncationCharCount(comment, postPage);
  // Style tags don't count towards the length, as in the usual excerpt
  const styleTags = html.match(STYLE_TAG_PATTERN)?.join("") ?? "";
  const htmlWithoutStyles = html.replace(STYLE_TAG_PATTERN, "");
  if (pathname === runPageUrl || htmlWithoutStyles.length <= maxLength) {
    return null;
  }
  return wrapLlmReply(comment, styleTags + truncate(htmlWithoutStyles, maxLength, "characters", `... <span class="read-more-button"><a href="${runPageUrl}">View full output</a></span>`));
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
  const { html = "" } = comment.contents || {}

  const bodyClasses = classNames(
    className,
    !comment.answer && classes.commentStyling,
    comment.answer && classes.answerStyling,
    comment.retracted && classes.retracted,
  );

  if (comment.deleted) { return <CommentDeletedMetadata documentId={comment._id}/> }
  if (collapsed) { return null }

  const innerHtml = (truncated && !truncationDisabledByUserConfig)
    ? wrapLlmReply(comment, commentExcerptFromHTML(comment, postPage))
    : (getLlmReplyExcerpt(comment, postPage, pathname) ?? wrapLlmReply(comment, html ?? ''))

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



