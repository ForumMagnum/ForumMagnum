"use client";

import React, { useState } from "react";
import classNames from "classnames";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import ForumIcon, { type ForumIconName } from "@/components/common/ForumIcon";
import { getMarkdownItNoMathjax } from "@/lib/utils/markdownItPlugins";
import { sanitize } from "@/lib/utils/sanitize";

const MAX_TOOL_RESULT_CHARACTERS = 5000;
const MAX_SITE_MARKERS = 3;
const LLM_FONT_FAMILY = '"cronos-pro", serif';

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
  origin: "reasoning" | "text",
  text: string,
}

interface ToolStep {
  kind: "tool",
  call: LlmRunTranscriptEntryFragment,
  result: LlmRunTranscriptEntryFragment | null,
  links: LinkResult[],
}

interface SourcesStep {
  kind: "sources",
  sources: LinkResult[],
}

type TranscriptStep = ModelTextStep | ToolStep | SourcesStep;

interface LinkResult {
  url: string,
  title: string,
}

const LlmTranscript = ({ entries, finalResponse, isRunning, initialVisibleSteps }: {
  entries: LlmRunTranscriptEntryFragment[],
  finalResponse: string | null,
  isRunning: boolean,
  initialVisibleSteps?: number,
}) => {
  const classes = useStyles(styles);
  const [showAll, setShowAll] = useState(false);
  const steps = getTranscriptSteps(entries, finalResponse);
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
  const description = describeTool(step.call);
  const { result, links } = step;

  if (result?.type === "toolError") {
    return <div className={classNames(classes.step, classes.row)}>
      <ForumIcon icon="Warning" className={classNames(classes.icon, classes.errorIcon)} />
      <span className={classNames(classes.label, classes.errorLabel)}>{description.failedLabel}</span>
      {description.detail && <span className={classes.detail}>{description.detail}</span>}
      <span className={classNames(classes.meta, classes.errorMeta)}>{result.text}</span>
    </div>;
  }

  if (!result) {
    return <div className={classNames(classes.step, classes.row)}>
      <ForumIcon icon={description.icon} className={classes.icon} />
      <span className={classNames(classes.label, isRunning && classes.shimmer)}>
        {isRunning ? description.inProgressLabel : description.label}
      </span>
      {description.detail && <span className={classes.detail}>{description.detail}</span>}
    </div>;
  }

  const textOutput = links.length ? null : getResultText(result);
  if (!links.length && textOutput === null) {
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
        {links.length > 0 && <SiteMarkers urls={links.map((link) => link.url)} />}
        {links.length > 0 && `${links.length} ${links.length === 1 ? "result" : "results"}`}
        <span className={classes.chevron} />
      </span>
    </summary>
    <div className={classes.body}>
      {links.length > 0
        ? <LinkList links={links} />
        : <pre className={classes.pre}>{textOutput}</pre>}
    </div>
  </details>;
};

const SourcesStepItem = ({ sources }: { sources: LinkResult[] }) => {
  const classes = useStyles(styles);
  return <details className={classes.step}>
    <summary className={classNames(classes.row, classes.expandableRow)}>
      <ForumIcon icon="ListBullet" className={classes.icon} />
      <span className={classes.label}>{sources.length} {sources.length === 1 ? "source" : "sources"}</span>
      <span className={classes.meta}><span className={classes.chevron} /></span>
    </summary>
    <div className={classes.body}>
      <LinkList links={sources} />
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

function getTranscriptSteps(entries: LlmRunTranscriptEntryFragment[], finalResponse: string | null): TranscriptStep[] {
  const steps = entries.reduce<TranscriptStep[]>((stepsSoFar, entry) => {
    switch (entry.type) {
      case "reasoning":
      case "text":
        return addModelText(stepsSoFar, entry.type, entry.text ?? "");
      case "toolCall":
        return [...stepsSoFar, getToolStep(entry, entries)];
      case "source":
        return entry.url ? addSource(stepsSoFar, { url: entry.url, title: entry.title ?? entry.url }) : stepsSoFar;
      default:
        return stepsSoFar;
    }
  }, []);
  return steps.filter((step) => !isRepeatedResponse(step, finalResponse));
}

function addModelText(steps: TranscriptStep[], origin: ModelTextStep["origin"], text: string): TranscriptStep[] {
  const previous = steps[steps.length - 1];
  if (origin === "text" && previous?.kind === "modelText" && previous.origin === "text") {
    return [...steps.slice(0, -1), { ...previous, text: previous.text + text }];
  }
  return text.trim() ? [...steps, { kind: "modelText", origin, text }] : steps;
}

function isRepeatedResponse(step: TranscriptStep, finalResponse: string | null): boolean {
  return step.kind === "modelText" && step.origin === "text" && step.text.trim() === finalResponse?.trim();
}

function getToolStep(call: LlmRunTranscriptEntryFragment, entries: LlmRunTranscriptEntryFragment[]): ToolStep {
  const toolEntries = entries.filter((entry) => entry.toolCallId === call.toolCallId);
  const result = toolEntries.find((entry) => entry.type === "toolResult" || entry.type === "toolError") ?? null;
  const links = toolEntries
    .filter((entry) => entry.type === "resultLink")
    .flatMap((entry) => entry.url ? [{ url: entry.url, title: entry.title ?? entry.url }] : []);
  return { kind: "tool", call, result, links };
}

function addSource(steps: TranscriptStep[], source: LinkResult): TranscriptStep[] {
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

function describeTool({ toolName, query, url }: LlmRunTranscriptEntryFragment): ToolDescription {
  const shortUrl = url ? getShortUrl(url) : null;
  switch (toolName) {
    case "parallel_search":
      return { icon: "Search", label: "Searched the web", inProgressLabel: "Searching the web", failedLabel: "Couldn't search the web", detail: query };
    case "browserbase_fetch":
      return { icon: "Link", label: "Read", inProgressLabel: "Reading", failedLabel: "Couldn't open", detail: shortUrl };
    case "readLessWrong":
      return { icon: "Document", label: "Read", inProgressLabel: "Reading", failedLabel: "Couldn't open", detail: shortUrl };
    case "searchLessWrong":
    case "semanticSearchLessWrong":
      return { icon: "Book", label: "Searched LessWrong", inProgressLabel: "Searching LessWrong", failedLabel: "Couldn't search LessWrong", detail: query };
    default: {
      const name = toolName ?? "Tool";
      return { icon: "Settings", label: name, inProgressLabel: name, failedLabel: `${name} failed`, detail: null };
    }
  }
}

function getResultText(result: LlmRunTranscriptEntryFragment): string | null {
  const text = result.text ?? getUnrecognizedOutputText(result.extra);
  if (text === null) {
    return null;
  }
  return text.length > MAX_TOOL_RESULT_CHARACTERS
    ? `${text.slice(0, MAX_TOOL_RESULT_CHARACTERS)}\n\n[Truncated]`
    : text;
}

function getUnrecognizedOutputText(extra: unknown): string | null {
  const output = getField(extra, "output");
  return output === undefined ? null : JSON.stringify(output, null, 2);
}

function getField(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }
  return Object.entries(value).find(([fieldName]) => fieldName === key)?.[1];
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

export default LlmTranscript;
