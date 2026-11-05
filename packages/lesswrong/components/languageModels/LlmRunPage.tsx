"use client";

import React, { useEffect, useState } from "react";
import classNames from "classnames";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import Loading from "@/components/vulcan-core/Loading";
import FormatDate from "@/components/common/FormatDate";
import CommentsNode from "@/components/comments/CommentsNode";
import LlmTranscript from "@/components/languageModels/LlmTranscript";
import ForumIcon from "@/components/common/ForumIcon";
import LWTooltip from "@/components/common/LWTooltip";
import { Link } from "@/lib/reactRouterWrapper";
import { commentGetPageUrlFromIds } from "@/lib/collections/comments/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { getLlmVersionFullName } from "@/lib/languageModels/llmRegistry";

const POLL_INTERVAL_MS = 3000;
const COPIED_INDICATOR_MS = 1500;
const FINISHED_RUN_VISIBLE_STEPS = 3;
const TITLE_MAX_CHARACTERS = 200;
const THREAD_HEADING = "\n# Thread\n";

const LlmRunQuery = gql(`
  query LlmRunPageQuery($runId: String!) {
    llmRun(selector: { _id: $runId }) {
      result {
        ...LlmRunPageFragment
      }
    }
  }
`);

const LlmRunCommentQuery = gql(`
  query LlmRunPageCommentQuery($documentId: String) {
    comment(selector: { _id: $documentId }) {
      result {
        ...CommentsList
      }
    }
  }
`);

const styles = defineStyles("LlmRunPage", (theme: ThemeType) => ({
  header: {
    paddingTop: 40,
    [theme.breakpoints.down("xs")]: {
      paddingTop: 20,
    },
  },
  title: {
    margin: 0,
    paddingLeft: 14,
    borderLeft: theme.typography.blockquote.borderLeft,
    ...theme.typography.headerStyle,
    fontSize: 22,
    lineHeight: 1.35,
    fontWeight: 600,
    color: theme.palette.text.normal,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  mention: {
    color: theme.palette.link.color,
    // Layout's global `h1 *` rule would otherwise set it to 500
    fontWeight: "inherit",
  },
  meta: {
    ...theme.typography.commentStyle,
    marginTop: 8,
    fontSize: 14,
    lineHeight: "20px",
    color: theme.palette.grey[600],
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 6,
    "& a": {
      color: theme.palette.grey[600],
    },
  },
  person: {
    color: theme.palette.text.normal,
  },
  failed: {
    color: theme.palette.error.main,
  },
  inlineLoading: {
    display: "inline-block",
    width: "auto",
    height: "auto",
    margin: 0,
    "& div": {
      width: 6,
      height: 6,
    },
  },
  section: {
    position: "relative",
    marginTop: 32,
    "& .llm-view-run-link": {
      display: "none",
    },
  },
  sectionLabel: {
    ...theme.typography.commentStyle,
    position: "absolute",
    top: 0,
    right: "calc(100% + 20px)",
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    whiteSpace: "nowrap",
    color: theme.palette.text.normal,
    [theme.breakpoints.down("md")]: {
      position: "static",
      marginBottom: 10,
    },
  },
  promptAnchors: {
    ...theme.typography.commentStyle,
    position: "absolute",
    top: 30,
    right: "calc(100% + 20px)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 13,
    textAlign: "right",
    whiteSpace: "nowrap",
    "& a": {
      color: theme.palette.grey[600],
    },
    [theme.breakpoints.down("md")]: {
      position: "static",
      flexDirection: "row",
      gap: 14,
      marginBottom: 8,
      textAlign: "left",
    },
  },
  promptBlock: {
    position: "relative",
    padding: "12px 40px 12px 14px",
    background: theme.palette.panelBackground.darken04,
    borderRadius: theme.borderRadius.small,
  },
  copyButtonPosition: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  copyButton: {
    display: "flex",
    padding: 2,
    border: "none",
    background: "none",
    cursor: "pointer",
    color: theme.palette.grey[500],
    "&:hover": {
      color: theme.palette.grey[700],
    },
  },
  copyIcon: {
    "--icon-size": "16px",
  },
  promptText: {
    fontFamily: theme.typography.code.fontFamily,
    fontSize: 12.5,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    color: theme.palette.text.normal,
  },
  promptCollapsed: {
    maxHeight: "6em",
    overflow: "hidden",
  },
  promptPart: {
    scrollMarginTop: 80,
    "& + &": {
      marginTop: "1.5em",
    },
  },
  readMore: {
    ...theme.typography.commentStyle,
    marginTop: 4,
    padding: 0,
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: 12.8,
    color: theme.palette.grey[600],
    "&:hover": {
      opacity: 0.7,
    },
  },
  outputStatus: {
    ...theme.typography.commentStyle,
    margin: "4px 0 0 20px",
    fontSize: 14,
  },
  errorDetail: {
    display: "block",
    marginTop: 2,
    fontFamily: theme.typography.code.fontFamily,
    fontSize: 12.5,
    color: theme.palette.text.dim60,
  },
  seeInContext: {
    ...theme.typography.commentStyle,
    textAlign: "right",
    marginRight: 10,
    fontSize: 14,
    "& a": {
      color: theme.palette.lwTertiary.main,
    },
  },
}));

interface PromptPart {
  anchor: string,
  label: string,
  text: string,
}

export default function LlmRunPage({ runId }: { runId: string }) {
  const classes = useStyles(styles);
  const [isFinished, setIsFinished] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const { data, loading } = useQuery(LlmRunQuery, {
    variables: { runId },
    pollInterval: isFinished ? 0 : POLL_INTERVAL_MS,
  });
  const run = data?.llmRun?.result;
  const runIsFinished = run?.status === "completed" || run?.status === "failed";

  const { data: triggerCommentData } = useQuery(LlmRunCommentQuery, {
    variables: { documentId: run?.triggerCommentId },
    skip: !run?.triggerCommentId,
  });
  const { data: replyCommentData, refetch: refetchReplyComment } = useQuery(LlmRunCommentQuery, {
    variables: { documentId: run?.replyCommentId },
    skip: !run?.replyCommentId,
  });
  const triggerComment = triggerCommentData?.comment?.result;
  const replyComment = replyCommentData?.comment?.result;

  const replyCommentId = run?.replyCommentId;
  useEffect(() => {
    if (runIsFinished) {
      setIsFinished(true);
      if (replyCommentId) {
        void refetchReplyComment();
      }
    }
  }, [runIsFinished, replyCommentId, refetchReplyComment]);

  if (!run) {
    return <SingleColumnSection>{loading ? <Loading /> : "This run doesn't exist."}</SingleColumnSection>;
  }

  const isRunning = !runIsFinished;
  const isCompleted = run.status === "completed";
  const modelFullName = getLlmVersionFullName(run.modelName);
  const mention = `@${modelFullName}`;
  const promptParts = getPromptParts(run.systemPrompt, run.contextMessage);
  const copyPrompt = async () => {
    await navigator.clipboard.writeText([run.systemPrompt, run.contextMessage].filter(Boolean).join("\n\n"));
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), COPIED_INDICATOR_MS);
  };
  const { post } = run;
  const triggerCommentText = triggerComment?.contents?.plaintextMainText;
  const titleExcerpt = triggerCommentText && getTitleExcerpt(triggerCommentText, mention);
  const title = titleExcerpt ? highlightMention(titleExcerpt, mention, classes.mention) : `${modelFullName}'s reply`;

  return <SingleColumnSection>
    <div className={classes.header}>
      <h1 className={classes.title}>{title}</h1>
      <div className={classes.meta}>
        {triggerComment?.user && post && <span>
          <span className={classes.person}>{triggerComment.user.displayName}</span> asked <span className={classes.person}>{modelFullName}</span> on <Link to={postGetPageUrl(post)}>{post.title}</Link> ·
        </span>}
        {isRunning && <>
          <span>Writing</span>
          <Loading className={classes.inlineLoading} />
          <span>· started <FormatDate date={run.createdAt} includeAgo /></span>
        </>}
        {run.status === "failed" && <span className={classes.failed}>Failed ·</span>}
        {runIsFinished && <FormatDate date={run.createdAt} format="Do MMM YYYY" tooltip={false} />}
      </div>
    </div>

    <section className={classes.section}>
      <h2 className={classes.sectionLabel}>Full Prompt</h2>
      {promptParts.length > 1 && <nav className={classes.promptAnchors}>
        {promptParts.map((part) => <a key={part.anchor} href={`#${part.anchor}`} onClick={() => setPromptExpanded(true)}>
          {part.label}
        </a>)}
      </nav>}
      <div className={classes.promptBlock}>
        <LWTooltip title="Copy prompt" className={classes.copyButtonPosition}>
          <button className={classes.copyButton} onClick={copyPrompt} aria-label="Copy prompt">
            <ForumIcon icon={promptCopied ? "Check" : "ClipboardDocument"} className={classes.copyIcon} />
          </button>
        </LWTooltip>
        <div className={classNames(classes.promptText, !promptExpanded && classes.promptCollapsed)}>
          {promptParts.map((part) => <div key={part.anchor} id={part.anchor} className={classes.promptPart}>{part.text}</div>)}
        </div>
        {!promptExpanded && <button className={classes.readMore} onClick={() => setPromptExpanded(true)}>
          (read more)
        </button>}
      </div>
    </section>

    <section className={classes.section}>
      <h2 className={classes.sectionLabel}>Steps</h2>
      <LlmTranscript
        entries={run.transcriptEntries}
        finalResponse={run.response}
        isRunning={isRunning}
        initialVisibleSteps={isCompleted ? FINISHED_RUN_VISIBLE_STEPS : undefined}
      />
    </section>

    <section className={classes.section}>
      <h2 className={classes.sectionLabel}>Output</h2>
      {triggerComment && <CommentsNode
        comment={triggerComment}
        childComments={isCompleted && replyComment ? [{ item: replyComment, children: [] }] : []}
        treeOptions={{ showPostTitle: false, forceNotSingleLine: true }}
        expandAllThreads
        forceUnCollapsed
        noAutoScroll
      />}
      {isRunning && <div className={classes.outputStatus}><Loading className={classes.inlineLoading} /></div>}
      {run.status === "failed" && <div className={classNames(classes.outputStatus, classes.failed)}>
        {modelFullName} couldn't finish this reply.
        {run.error && <span className={classes.errorDetail}>{run.error}</span>}
      </div>}
      {isCompleted && post && run.replyCommentId && <div className={classes.seeInContext}>
        <Link to={commentGetPageUrlFromIds({ postId: post._id, postSlug: post.slug, commentId: run.replyCommentId })}>See in context</Link>
      </div>}
    </section>
  </SingleColumnSection>;
}

function getPromptParts(systemPrompt: string, contextMessage: string | null): PromptPart[] {
  const parts: PromptPart[] = [{ anchor: "prompt-system", label: "System prompt", text: systemPrompt }];
  if (!contextMessage) {
    return parts;
  }
  const threadStart = contextMessage.lastIndexOf(THREAD_HEADING);
  if (threadStart === -1) {
    return [...parts, { anchor: "prompt-context", label: "Context", text: contextMessage }];
  }
  return [
    ...parts,
    { anchor: "prompt-post", label: "Post", text: contextMessage.slice(0, threadStart).trim() },
    { anchor: "prompt-thread", label: "Thread", text: contextMessage.slice(threadStart).trim() },
  ];
}

function getTitleExcerpt(text: string, mention: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= TITLE_MAX_CHARACTERS) {
    return trimmed;
  }
  const sentences = Array.from(new Intl.Segmenter("en", { granularity: "sentence" }).segment(trimmed), ({ segment }) => segment.trim());
  const mentionIndex = sentences.findIndex((sentence) => sentence.includes(mention));
  if (mentionIndex === -1) {
    return trimmed;
  }
  return mentionIndex === 0 ? sentences[0] : `…${sentences[mentionIndex]}`;
}

function highlightMention(text: string, mention: string, className: string): React.ReactNode {
  return text.split(mention).map((part, index) => <React.Fragment key={index}>
    {index > 0 && <span className={className}>{mention}</span>}
    {part}
  </React.Fragment>);
}
