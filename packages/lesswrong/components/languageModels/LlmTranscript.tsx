"use client";

import React, { useState } from "react";
import classNames from "classnames";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import ForumIcon, { type ForumIconName } from "@/components/common/ForumIcon";
import { getMarkdownItNoMathjax } from "@/lib/utils/markdownItPlugins";
import { sanitize } from "@/lib/utils/sanitize";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";

const MAX_TOOL_RESULT_CHARACTERS = 5000;
const MAX_SITE_MARKERS = 3;
const LLM_FONT_FAMILY = '"cronos-pro", serif';

const WEB_SEARCH_TOOLS = new Set(["web_search", "google_search", "parallel_search"]);

const styles = defineStyles("LlmTranscript", (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
  },
  step: {
    padding: "5px 0",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    fontSize: 14,
    lineHeight: "20px",
    color: theme.palette.text.dim60,
    listStyle: "none",
    "&::-webkit-details-marker": {
      display: "none",
    },
  },
  expandableRow: {
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.text.normal,
    },
  },
  icon: {
    "--icon-size": "14px",
    flexShrink: 0,
    color: theme.palette.grey[500],
  },
  errorIcon: {
    color: theme.palette.error.main,
  },
  label: {
    flexShrink: 0,
  },
  errorLabel: {
    color: theme.palette.error.main,
  },
  detail: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: theme.palette.grey[500],
  },
  meta: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
    fontSize: 13,
    color: theme.palette.grey[500],
    whiteSpace: "nowrap",
  },
  errorMeta: {
    maxWidth: "40%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: theme.palette.error.main,
  },
  chevron: {
    width: 0,
    height: 0,
    borderStyle: "solid",
    borderWidth: "4px 0 4px 5px",
    borderColor: `transparent transparent transparent ${theme.palette.grey[600]}`,
    transition: "transform 0.15s",
    "details[open] > summary &": {
      transform: "rotate(90deg)",
    },
  },
  siteMarkers: {
    display: "inline-flex",
  },
  siteMarker: {
    width: 15,
    height: 15,
    marginLeft: -5,
    borderRadius: "50%",
    border: `1.5px solid ${theme.palette.background.default}`,
    background: theme.palette.grey[500],
    color: theme.palette.text.alwaysWhite,
    fontSize: 8.5,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textTransform: "uppercase",
    "&:first-child": {
      marginLeft: 0,
    },
  },
  body: {
    padding: "2px 0 8px 22px",
    fontSize: 13.5,
    lineHeight: 1.5,
    "& ol": {
      margin: 0,
      paddingLeft: 18,
    },
  },
  domain: {
    marginLeft: 4,
    fontSize: 12.5,
    color: theme.palette.grey[500],
  },
  pre: {
    margin: 0,
    padding: "10px 12px",
    maxHeight: 320,
    overflow: "auto",
    fontFamily: theme.typography.code.fontFamily,
    fontSize: 12,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    background: theme.palette.panelBackground.darken04,
    borderRadius: theme.borderRadius.small,
  },
  modelText: {
    display: "flex",
    gap: 8,
    cursor: "pointer",
    fontFamily: LLM_FONT_FAMILY,
    fontSize: 15,
    lineHeight: 1.5,
    color: theme.palette.text.dim60,
    "& $icon": {
      marginTop: 3,
    },
    "& p": {
      margin: "0 0 0.5em",
    },
    "& p:last-child": {
      marginBottom: 0,
    },
  },
  modelTextContent: {
    minWidth: 0,
  },
  clamped: {
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  shimmer: {
    background: `linear-gradient(90deg, ${theme.palette.grey[600]} 0%, ${theme.palette.grey[600]} 40%, ${theme.palette.text.normal} 50%, ${theme.palette.grey[600]} 60%, ${theme.palette.grey[600]} 100%)`,
    backgroundSize: "200% 100%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    animation: "llm-transcript-shimmer 1.8s linear infinite",
  },
  "@keyframes llm-transcript-shimmer": {
    from: { backgroundPosition: "100% 0" },
    to: { backgroundPosition: "-100% 0" },
  },
  showAll: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    marginTop: 4,
    marginLeft: 22,
    padding: 0,
    border: "none",
    background: "none",
    cursor: "pointer",
    color: theme.palette.lwTertiary.main,
    "&:hover": {
      opacity: 0.7,
    },
  },
}));

interface ModelTextStep {
  kind: "modelText",
  text: string,
}

interface ToolStep {
  kind: "tool",
  toolCallId: string,
  toolName: string,
  input: unknown,
  output?: { value: unknown },
  error?: string,
}

interface Source {
  url: string,
  title: string | null,
}

interface SourcesStep {
  kind: "sources",
  sources: Source[],
}

type TranscriptStep = ModelTextStep | ToolStep | SourcesStep;

interface LinkResult {
  url: string,
  title: string,
}

const LlmTranscript = ({ transcript, finalResponse, isRunning, initialVisibleSteps }: {
  transcript: LlmTranscriptEntry[],
  finalResponse: string | null,
  isRunning: boolean,
  initialVisibleSteps?: number,
}) => {
  const classes = useStyles(styles);
  const [showAll, setShowAll] = useState(false);
  const steps = getTranscriptSteps(transcript, finalResponse);
  const isCollapsed = !showAll && initialVisibleSteps !== undefined && steps.length > initialVisibleSteps;
  const visibleSteps = isCollapsed ? steps.slice(0, initialVisibleSteps) : steps;

  return <div className={classes.root}>
    {visibleSteps.map((step, index) => <TranscriptStepItem key={index} step={step} isRunning={isRunning} />)}
    {isRunning && steps.length === 0 && <div className={classNames(classes.step, classes.row)}>
      <span className={classes.shimmer}>Starting</span>
    </div>}
    {isCollapsed && <button className={classes.showAll} onClick={() => setShowAll(true)}>
      Show all {steps.length} steps
    </button>}
  </div>;
};

const TranscriptStepItem = ({ step, isRunning }: { step: TranscriptStep, isRunning: boolean }) => {
  switch (step.kind) {
    case "modelText":
      return <ModelTextStepItem text={step.text} />;
    case "tool":
      return <ToolStepItem step={step} isRunning={isRunning} />;
    case "sources":
      return <SourcesStepItem sources={step.sources} />;
  }
};

const ModelTextStepItem = ({ text }: { text: string }) => {
  const classes = useStyles(styles);
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded(!expanded);
  return <div className={classes.step}>
    <div
      className={classes.modelText}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={toggleExpanded}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleExpanded();
        }
      }}
    >
      <ForumIcon icon="LightbulbChat" className={classes.icon} />
      <div
        className={classNames(classes.modelTextContent, !expanded && classes.clamped)}
        dangerouslySetInnerHTML={{ __html: sanitize(getMarkdownItNoMathjax().render(text)) }}
      />
    </div>
  </div>;
};

const ToolStepItem = ({ step, isRunning }: { step: ToolStep, isRunning: boolean }) => {
  const classes = useStyles(styles);
  const description = describeTool(step);

  if (step.error !== undefined) {
    return <div className={classNames(classes.step, classes.row)}>
      <ForumIcon icon="Warning" className={classNames(classes.icon, classes.errorIcon)} />
      <span className={classNames(classes.label, classes.errorLabel)}>{description.failedLabel}</span>
      {description.detail && <span className={classes.detail}>{description.detail}</span>}
      <span className={classNames(classes.meta, classes.errorMeta)}>{step.error}</span>
    </div>;
  }

  if (!step.output) {
    return <div className={classNames(classes.step, classes.row)}>
      <ForumIcon icon={description.icon} className={classes.icon} />
      <span className={classNames(classes.label, isRunning && classes.shimmer)}>
        {isRunning ? description.inProgressLabel : description.label}
      </span>
      {description.detail && <span className={classes.detail}>{description.detail}</span>}
    </div>;
  }

  const linkResults = getLinkResults(step.output.value);
  const textOutput = linkResults ? null : getTextOutput(step.output.value);
  if (!linkResults && textOutput === null) {
    return <div className={classNames(classes.step, classes.row)}>
      <ForumIcon icon={description.icon} className={classes.icon} />
      <span className={classes.label}>{description.label}</span>
      {description.detail && <span className={classes.detail}>{description.detail}</span>}
    </div>;
  }
  return <details className={classes.step}>
    <summary className={classNames(classes.row, classes.expandableRow)}>
      <ForumIcon icon={description.icon} className={classes.icon} />
      <span className={classes.label}>{description.label}</span>
      {description.detail && <span className={classes.detail}>{description.detail}</span>}
      <span className={classes.meta}>
        {linkResults && <SiteMarkers urls={linkResults.map((result) => result.url)} />}
        {linkResults && `${linkResults.length} ${linkResults.length === 1 ? "result" : "results"}`}
        <span className={classes.chevron} />
      </span>
    </summary>
    <div className={classes.body}>
      {linkResults
        ? <LinkList links={linkResults} />
        : <pre className={classes.pre}>{textOutput}</pre>}
    </div>
  </details>;
};

const SourcesStepItem = ({ sources }: { sources: SourcesStep["sources"] }) => {
  const classes = useStyles(styles);
  return <details className={classes.step}>
    <summary className={classNames(classes.row, classes.expandableRow)}>
      <ForumIcon icon="ListBullet" className={classes.icon} />
      <span className={classes.label}>{sources.length} {sources.length === 1 ? "source" : "sources"}</span>
      <span className={classes.meta}><span className={classes.chevron} /></span>
    </summary>
    <div className={classes.body}>
      <LinkList links={sources.map(({ url, title }) => ({ url, title: title ?? url }))} />
    </div>
  </details>;
};

const LinkList = ({ links }: { links: LinkResult[] }) => {
  const classes = useStyles(styles);
  return <ol>
    {links.map(({ url, title }, index) => <li key={index}>
      <a href={url} target="_blank" rel="noopener noreferrer">{title}</a>
      <span className={classes.domain}>{getHostname(url)}</span>
    </li>)}
  </ol>;
};

const SiteMarkers = ({ urls }: { urls: string[] }) => {
  const classes = useStyles(styles);
  const hostnames = [...new Set(urls.map(getHostname))].slice(0, MAX_SITE_MARKERS);
  return <span className={classes.siteMarkers} aria-hidden="true">
    {hostnames.map((hostname) => <span key={hostname} className={classes.siteMarker}>{hostname.replace(/^www\./, "").charAt(0)}</span>)}
  </span>;
};

function getTranscriptSteps(transcript: LlmTranscriptEntry[], finalResponse: string | null): TranscriptStep[] {
  return transcript.reduce<TranscriptStep[]>((steps, entry) => {
    switch (entry.type) {
      case "reasoning":
      case "text": {
        const text = entry.text.trim();
        const repeatsResponse = entry.type === "text" && text === finalResponse?.trim();
        return text && !repeatsResponse ? [...steps, { kind: "modelText", text }] : steps;
      }
      case "tool-call":
        return [...steps, getToolStep(entry.toolCallId, entry.toolName, entry.input, transcript)];
      case "source":
        return addSource(steps, { url: entry.url, title: entry.title });
      case "tool-result":
      case "tool-error":
        return steps;
    }
  }, []);
}

function getToolStep(toolCallId: string, toolName: string, input: unknown, transcript: LlmTranscriptEntry[]): ToolStep {
  const outcome = transcript.find((entry) => (entry.type === "tool-result" || entry.type === "tool-error") && entry.toolCallId === toolCallId);
  return {
    kind: "tool",
    toolCallId,
    toolName,
    input,
    ...(outcome?.type === "tool-result" ? { output: { value: outcome.output } } : {}),
    ...(outcome?.type === "tool-error" ? { error: outcome.error } : {}),
  };
}

function addSource(steps: TranscriptStep[], source: Source): TranscriptStep[] {
  const previous = steps[steps.length - 1];
  if (previous?.kind !== "sources") {
    return [...steps, { kind: "sources", sources: [source] }];
  }
  if (previous.sources.some(({ url }) => url === source.url)) {
    return steps;
  }
  return [...steps.slice(0, -1), { kind: "sources", sources: [...previous.sources, source] }];
}

interface ToolDescription {
  icon: ForumIconName,
  label: string,
  inProgressLabel: string,
  failedLabel: string,
  detail: string | null,
}

function describeTool(step: ToolStep): ToolDescription {
  const { toolName, input } = step;
  if (WEB_SEARCH_TOOLS.has(toolName)) {
    const action = getField(step.output?.value, "action");
    const openedUrl = getStringField(action, "type") === "openPage" ? getStringField(action, "url") : undefined;
    if (openedUrl) {
      return { icon: "Link", label: "Read", inProgressLabel: "Reading", failedLabel: "Couldn't open", detail: getShortUrl(openedUrl) };
    }
    const query = getStringField(input, "query") ?? getStringField(input, "objective") ?? getStringField(action, "query");
    return { icon: "Search", label: "Searched the web", inProgressLabel: "Searching the web", failedLabel: "Couldn't search the web", detail: query ?? null };
  }
  switch (toolName) {
    case "browserbase_fetch":
    case "readLessWrong": {
      const url = getStringField(input, "url");
      return { icon: toolName === "readLessWrong" ? "Document" : "Link", label: "Read", inProgressLabel: "Reading", failedLabel: "Couldn't open", detail: url ? getShortUrl(url) : null };
    }
    case "searchLessWrong":
    case "semanticSearchLessWrong": {
      const query = getStringField(input, "query");
      const author = getStringField(input, "author");
      const detail = query && author ? `${query}, by ${author}` : query ?? null;
      return { icon: "Book", label: "Searched LessWrong", inProgressLabel: "Searching LessWrong", failedLabel: "Couldn't search LessWrong", detail };
    }
    default:
      return { icon: "Settings", label: toolName, inProgressLabel: toolName, failedLabel: `${toolName} failed`, detail: null };
  }
}

function getLinkResults(output: unknown): LinkResult[] | null {
  const list = Array.isArray(output) ? output : getField(output, "results") ?? getField(output, "sources");
  if (!Array.isArray(list) || list.length === 0) {
    return null;
  }
  const links = filterNonnull(list.map(toLinkResult));
  return links.length === list.length ? links : null;
}

function toLinkResult(item: unknown): LinkResult | null {
  const url = getStringField(item, "url");
  return url ? { url, title: getStringField(item, "title") ?? url } : null;
}

function getField(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }
  return Object.entries(value).find(([fieldName]) => fieldName === key)?.[1];
}

function getStringField(value: unknown, key: string): string | undefined {
  const field = getField(value, key);
  return typeof field === "string" && field ? field : undefined;
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getShortUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "");
}

function getTextOutput(output: unknown): string | null {
  const isActionOnly = typeof output === "object" && output !== null && Object.keys(output).every((key) => key === "action");
  if (isActionOnly) {
    return null;
  }
  const text = getOutputText(output);
  return text.length > MAX_TOOL_RESULT_CHARACTERS
    ? `${text.slice(0, MAX_TOOL_RESULT_CHARACTERS)}\n\n[Truncated]`
    : text;
}

function getOutputText(output: unknown): string {
  if (typeof output === "string") {
    return output;
  }
  return getStringField(output, "content") ?? JSON.stringify(output, null, 2);
}

export default LlmTranscript;
