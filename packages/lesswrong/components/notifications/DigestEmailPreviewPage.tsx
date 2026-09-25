"use client";

import { AI_DIGEST_CLEAR_HISTORY_MAX_DAYS } from "@/lib/aiDigest/constants";
import React, { useState } from "react";
import { useMutation } from "@apollo/client/react";
import classNames from "classnames";
import { gql } from "@/lib/generated/gql-codegen";
import type { AiDigestEmailSamplePreviewQueryQuery } from "@/lib/generated/gql-codegen/graphql";
import { useQuery } from "@/lib/crud/useQuery";
import { useSubscribedLocation, useNavigate } from "@/lib/routeUtil";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import ErrorAccessDenied from "@/components/common/ErrorAccessDenied";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { useCurrentUser } from "@/components/common/withUser";
import UsersSearchAutoComplete from "@/components/search/UsersSearchAutoComplete";
import Loading from "@/components/vulcan-core/Loading";
import EmailPreview, {
  MOBILE_EMAIL_PREVIEW_WIDTH,
  type EmailPreviewViewport,
} from "./EmailPreview";

const GenerateAiDigestEmailSamplesMutation = gql(`
  mutation GenerateAiDigestEmailSamplesMutation(
    $userSlug: String!
    $count: Int
    $countsTowardHistory: Boolean
  ) {
    GenerateAiDigestEmailSamples(
      userSlug: $userSlug
      count: $count
      countsTowardHistory: $countsTowardHistory
    )
  }
`);

const DigestPreviewReaderQuery = gql(`
  query DigestPreviewReaderQuery($userSlug: String!) {
    users(selector: { usersProfile: { slug: $userSlug } }, limit: 1, enableTotal: false) {
      results {
        _id
      }
    }
  }
`);

const AiDigestEmailSamplesQuery = gql(`
  query AiDigestEmailSamplesQuery($recipientId: String!, $limit: Int) {
    aiDigestIssues(
      selector: { recipientIssues: { recipientId: $recipientId } }
      limit: $limit
      enableTotal: false
    ) {
      results {
        ...AiDigestIssuesList
      }
    }
  }
`);

const ClearAiDigestEmailSampleHistoryMutation = gql(`
  mutation ClearAiDigestEmailSampleHistoryMutation($userSlug: String!, $days: Int!) {
    ClearAiDigestEmailSampleHistory(userSlug: $userSlug, days: $days)
  }
`);

const AiDigestEmailSamplePreviewQuery = gql(`
  query AiDigestEmailSamplePreviewQuery($issueId: String!) {
    AiDigestEmailSamplePreview(issueId: $issueId) {
      email {
        to
        subject
        html
        text
      }
      durationMs
      calls {
        purpose
        modelId
        promptVersion
        systemPrompt
        prompt
        inputTokenCount
        outputTokenCount
        uncachedInputTokenCount
        cacheReadInputTokenCount
        cacheWriteInputTokenCount
        costUsd
        toolCalls {
          toolName
          input
        }
      }
    }
  }
`);

const DEFAULT_SAMPLE_COUNT = 3;
const DEFAULT_HISTORY_CLEAR_DAYS = 30;
const STORED_SAMPLE_LIMIT = 50;
const SAMPLE_LIST_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

type SamplePreviewView = "html" | "text" | "metadata";
const SAMPLE_PREVIEW_VIEWS: SamplePreviewView[] = ["html", "text", "metadata"];
const VIEWPORT_OPTIONS: { viewport: EmailPreviewViewport; label: string }[] = [
  { viewport: "desktop", label: "Desktop" },
  { viewport: "mobile", label: `Mobile ${MOBILE_EMAIL_PREVIEW_WIDTH}px` },
];

const styles = defineStyles("DigestEmailPreviewPage", (theme: ThemeType) => ({
  page: {
    maxWidth: 1180,
    width: "calc(100vw - 48px)",
    [theme.breakpoints.down("sm")]: {
      width: "calc(100vw - 24px)",
    },
  },
  header: {
    margin: "36px 0 22px",
    borderBottom: theme.palette.border.normal,
  },
  eyebrow: {
    color: theme.palette.grey[600],
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },
  title: {
    margin: "5px 0 6px",
    fontSize: 30,
    lineHeight: 1.15,
  },
  intro: {
    maxWidth: 720,
    margin: "0 0 20px",
    color: theme.palette.grey[600],
    fontSize: 14,
  },
  toolbar: {
    display: "grid",
    gridTemplateColumns: "minmax(220px, 1fr) 120px auto",
    gap: 12,
    alignItems: "flex-end",
    marginBottom: 18,
    padding: 14,
    border: theme.palette.border.normal,
    background: theme.palette.panelBackground.default,
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: "1fr 1fr",
    },
    [theme.breakpoints.down("xs")]: {
      gridTemplateColumns: "1fr",
    },
  },
  toolbarOption: {
    display: "flex",
    alignItems: "center",
    gridColumn: "1 / -1",
    gap: 7,
    color: theme.palette.grey[600],
    cursor: "pointer",
    fontSize: 12,
    "& input": {
      margin: 0,
    },
  },
  userSearch: {
    minHeight: 36,
    boxSizing: "border-box",
    padding: "1px 10px 0",
    border: theme.palette.border.normal,
    borderRadius: 3,
    background: theme.palette.panelBackground.default,
    "& .react-autosuggest__container": {
      width: "100%",
    },
    "& .react-autosuggest__container > *": {
      width: "100%",
    },
    "& input": {
      width: "100%",
    },
  },
  historyAdminBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    margin: "-7px 0 18px",
    color: theme.palette.grey[600],
    fontSize: 11,
    [theme.breakpoints.down("xs")]: {
      alignItems: "stretch",
      flexDirection: "column",
    },
  },
  historyDaysInput: {
    width: 64,
    height: 30,
    boxSizing: "border-box",
    padding: "5px 7px",
    border: theme.palette.border.normal,
    borderRadius: 3,
    background: theme.palette.panelBackground.default,
    color: theme.palette.text.normal,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: theme.palette.grey[600],
  },
  select: {
    height: 36,
    padding: "7px 10px",
    border: theme.palette.border.normal,
    borderRadius: 3,
    background: theme.palette.panelBackground.default,
    fontSize: 14,
  },
  button: {
    height: 36,
    padding: "7px 14px",
    border: theme.palette.border.normal,
    borderRadius: 3,
    background: theme.palette.panelBackground.default,
    cursor: "pointer",
    fontSize: 14,
    whiteSpace: "nowrap",
    "&:disabled": {
      opacity: 0.6,
      cursor: "default",
    },
  },
  primaryButton: {
    borderColor: theme.palette.primary.main,
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
  },
  generationStatus: {
    margin: "0 0 18px",
    padding: "10px 12px",
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    background: theme.palette.grey[200],
    fontSize: 13,
  },
  workbench: {
    display: "grid",
    gridTemplateColumns: "310px minmax(0, 1fr)",
    gap: 18,
    alignItems: "start",
    [theme.breakpoints.down("md")]: {
      gridTemplateColumns: "1fr",
    },
  },
  sidebar: {
    position: "sticky",
    top: 72,
    border: theme.palette.border.normal,
    background: theme.palette.panelBackground.default,
    [theme.breakpoints.down("md")]: {
      position: "static",
    },
  },
  sidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    padding: "12px 14px",
    borderBottom: theme.palette.border.normal,
  },
  sidebarTitle: {
    margin: 0,
    fontSize: 14,
  },
  sampleCount: {
    color: theme.palette.grey[600],
    fontSize: 12,
  },
  sampleList: {
    maxHeight: "calc(100vh - 250px)",
    overflowY: "auto",
    [theme.breakpoints.down("md")]: {
      maxHeight: 300,
    },
  },
  sampleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    width: "100%",
    padding: "12px 14px 12px 11px",
    border: "none",
    borderLeft: "3px solid transparent",
    borderBottom: theme.palette.border.normal,
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
    "&:hover": {
      background: theme.palette.grey[200],
    },
  },
  sampleRowSelected: {
    background: theme.palette.grey[200],
    borderLeftColor: theme.palette.primary.main,
  },
  sampleSubject: {
    minWidth: 0,
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.35,
  },
  sampleMetadata: {
    flexShrink: 0,
    color: theme.palette.grey[600],
    fontSize: 11,
    whiteSpace: "nowrap",
  },
  scratchLabel: {
    color: theme.palette.text.dim3,
    fontSize: 10,
    fontWeight: 500,
    textTransform: "uppercase",
  },
  previewPanel: {
    minWidth: 0,
    border: theme.palette.border.normal,
    background: theme.palette.panelBackground.default,
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    minHeight: 48,
    padding: "0 14px",
    borderBottom: theme.palette.border.normal,
    [theme.breakpoints.down("sm")]: {
      alignItems: "flex-start",
      flexDirection: "column",
      padding: 12,
    },
  },
  previewTitle: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: 13,
    fontWeight: 600,
  },
  previewControls: {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    gap: 10,
    [theme.breakpoints.down("xs")]: {
      alignItems: "flex-start",
      flexDirection: "column",
    },
  },
  previewTabs: {
    display: "flex",
    flexShrink: 0,
    gap: 4,
  },
  viewportToggle: {
    display: "flex",
    flexShrink: 0,
    gap: 4,
    paddingLeft: 10,
    borderLeft: theme.palette.border.normal,
    [theme.breakpoints.down("xs")]: {
      paddingLeft: 0,
      borderLeft: "none",
    },
  },
  previewTab: {
    padding: "5px 9px",
    border: "none",
    borderRadius: 3,
    background: "transparent",
    color: theme.palette.grey[600],
    cursor: "pointer",
    fontSize: 12,
  },
  previewTabSelected: {
    background: theme.palette.grey[200],
    color: theme.palette.primary.main,
    fontWeight: 600,
  },
  promptToggle: {
    padding: "5px 9px",
    border: theme.palette.border.normal,
    borderRadius: 3,
    background: "transparent",
    color: theme.palette.grey[600],
    cursor: "pointer",
    fontSize: 12,
  },
  promptPanel: {
    padding: "14px 18px",
    borderBottom: theme.palette.border.normal,
    background: theme.palette.grey[200],
  },
  promptSection: {
    "& + &": {
      marginTop: 18,
    },
  },
  promptTitle: {
    margin: "0 0 6px",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  promptText: {
    margin: 0,
    whiteSpace: "pre-wrap",
    overflowWrap: "anywhere",
    fontFamily: "Menlo, Consolas, monospace",
    fontSize: 11,
    lineHeight: 1.5,
  },
  previewBody: {
    minHeight: 560,
    padding: 14,
    overflow: "hidden",
  },
  metadataGrid: {
    display: "grid",
    gridTemplateColumns: "130px minmax(0, 1fr)",
    gap: "12px 18px",
    margin: 0,
    padding: 8,
    fontSize: 13,
    overflowWrap: "anywhere",
    [theme.breakpoints.down("xs")]: {
      gridTemplateColumns: "1fr",
      gap: 4,
    },
  },
  metadataLabel: {
    color: theme.palette.grey[600],
    fontWeight: 600,
  },
  metadataValue: {
    margin: 0,
  },
  emptyState: {
    padding: 24,
    color: theme.palette.grey[600],
    fontSize: 13,
    textAlign: "center",
  },
  error: {
    color: theme.palette.error.main,
  },
}));

function formatSampleListDate(createdAt: string): string {
  return SAMPLE_LIST_DATE_FORMATTER.format(new Date(createdAt));
}

function formatGenerationDuration(durationMs: number): string {
  const totalSeconds = Math.round(durationMs / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) {
    return `${seconds} sec`;
  }
  return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} sec`;
}

function formatSelectionCost(costUsd: number | null): string {
  return costUsd === null ? "Not reported" : `$${costUsd.toFixed(4)}`;
}

function modelCallMetadata(call: AiDigestEmailSamplePreviewQueryQuery["AiDigestEmailSamplePreview"]["calls"][number]): Array<[string, React.ReactNode]> {
  return [
    [`${call.purpose} model`, `${call.modelId} (${call.promptVersion})`],
    [`${call.purpose} input tokens`, call.inputTokenCount ?? "Not reported"],
    [`${call.purpose} output tokens`, call.outputTokenCount ?? "Not reported"],
    [`${call.purpose} uncached input`, call.uncachedInputTokenCount ?? "Not reported"],
    [`${call.purpose} cache read`, call.cacheReadInputTokenCount ?? "Not reported"],
    [`${call.purpose} cache write`, call.cacheWriteInputTokenCount ?? "Not reported"],
    [`${call.purpose} cost`, formatSelectionCost(call.costUsd)],
  ];
}

function ViewportToggle({ viewport, setViewport }: {
  viewport: EmailPreviewViewport;
  setViewport: (viewport: EmailPreviewViewport) => void;
}) {
  const classes = useStyles(styles);
  return (
    <div className={classes.viewportToggle} role="group" aria-label="Preview viewport">
      {VIEWPORT_OPTIONS.map((option) => (
        <button
          key={option.viewport}
          type="button"
          aria-pressed={viewport === option.viewport}
          className={classNames(
            classes.previewTab,
            viewport === option.viewport && classes.previewTabSelected,
          )}
          onClick={() => setViewport(option.viewport)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function DigestEmailPreviewPage() {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { pathname, query } = useSubscribedLocation();
  const navigate = useNavigate();
  const [samplePreviewView, setSamplePreviewView] = useState<SamplePreviewView>("html");
  const [promptsExpanded, setPromptsExpanded] = useState(false);
  const [previewViewport, setPreviewViewport] = useState<EmailPreviewViewport>("desktop");
  const activeSlug = query.user?.trim() || currentUser?.slug || "";
  const [includeNonAdmins, setIncludeNonAdmins] = useState(false);
  const [sampleCount, setSampleCount] = useState(DEFAULT_SAMPLE_COUNT);
  const [countsTowardHistory, setCountsTowardHistory] = useState(true);
  const [historyClearDays, setHistoryClearDays] = useState(DEFAULT_HISTORY_CLEAR_DAYS);
  const [historyMessage, setHistoryMessage] = useState<string | null>(null);
  const [generateSamples, {
    loading: samplesLoading,
    error: samplesError,
  }] = useMutation(GenerateAiDigestEmailSamplesMutation);
  const [clearSampleHistory, {
    loading: historyClearLoading,
    error: historyClearError,
  }] = useMutation(ClearAiDigestEmailSampleHistoryMutation);
  const { data: readerData } = useQuery(DigestPreviewReaderQuery, {
    variables: { userSlug: activeSlug },
    skip: !activeSlug,
    ssr: false,
  });
  const recipientId = readerData?.users?.results?.[0]?._id ?? null;
  const {
    data: storedSamplesData,
    loading: storedSamplesLoading,
    error: storedSamplesError,
    refetch: refetchStoredSamples,
  } = useQuery(AiDigestEmailSamplesQuery, {
    variables: {
      recipientId: recipientId ?? "",
      limit: STORED_SAMPLE_LIMIT,
    },
    skip: !recipientId,
    ssr: false,
    fetchPolicy: "network-only",
  });

  const storedSamples = storedSamplesData?.aiDigestIssues?.results ?? [];
  const effectiveSelectedIssueId = query.issue || storedSamples[0]?._id || null;
  const {
    data: selectedSampleData,
    loading: selectedSampleLoading,
    error: selectedSampleError,
  } = useQuery(AiDigestEmailSamplePreviewQuery, {
    variables: {
      issueId: effectiveSelectedIssueId ?? "",
    },
    skip: !effectiveSelectedIssueId,
    ssr: false,
    fetchPolicy: "network-only",
  });

  const selectedSampleSummary = storedSamples.find(
    (sample) => sample._id === effectiveSelectedIssueId,
  ) ?? null;

  const selectIssue = (issueId: string | null, userSlug = activeSlug) => {
    const search = new URLSearchParams({ user: userSlug });
    if (issueId) {
      search.set("issue", issueId);
    }
    setPromptsExpanded(false);
    navigate({ pathname, search: `?${search}` }, { replace: true, scroll: false });
  };

  const handleGenerateSamples = () => {
    setHistoryMessage(null);
    void generateSamples({
      variables: {
        userSlug: activeSlug,
        count: sampleCount,
        countsTowardHistory,
      },
    }).then(({ data: generatedData }) => {
      const newestIssueId = generatedData?.GenerateAiDigestEmailSamples[0] ?? null;
      selectIssue(newestIssueId);
      void refetchStoredSamples();
    }, () => undefined);
  };

  const handleClearSampleHistory = () => {
    if (!window.confirm(`Reset ${activeSlug}'s recommendation history from the last ${historyClearDays} days? Saved issues will remain.`)) {
      return;
    }
    setHistoryMessage(null);
    void clearSampleHistory({
      variables: {
        userSlug: activeSlug,
        days: historyClearDays,
      },
    }).then(({ data: clearData }) => {
      const clearedCount = clearData?.ClearAiDigestEmailSampleHistory ?? 0;
      selectIssue(null);
      setHistoryMessage(`Reset recommendation history for ${clearedCount} issue(s) for ${activeSlug}.`);
      void refetchStoredSamples();
    }, () => undefined);
  };

  const handleSelectReader = (_userId: string, { slug }: SearchUser) => {
    setHistoryMessage(null);
    selectIssue(null, slug);
    if (slug === activeSlug) {
      void refetchStoredSamples();
    }
  };

  if (!userIsAdmin(currentUser)) {
    return (
      <ErrorAccessDenied explanation="You must be logged in as an admin to use this page." />
    );
  }

  const selectedSampleDetails = selectedSampleData?.AiDigestEmailSamplePreview;
  const selectedSample = selectedSampleDetails?.email;

  const metadata: Array<[string, React.ReactNode]> = selectedSampleSummary && selectedSampleDetails ? [
    ["Generated", new Date(selectedSampleSummary.createdAt).toLocaleString()],
    ["Reader", activeSlug],
    ["Recipient", selectedSampleDetails.email.to],
    ["Recommendation history", selectedSampleSummary.countsTowardHistory ? "Counted" : "Scratch sample (not counted)"],
    ["Generation time", formatGenerationDuration(selectedSampleDetails.durationMs)],
    ...selectedSampleDetails.calls.flatMap(modelCallMetadata),
    ["Issue ID", selectedSampleSummary._id],
  ] : [];
  const storedPrompts = (selectedSampleDetails?.calls ?? []).flatMap((call) => [
    { label: `${call.purpose} system prompt`, text: call.systemPrompt },
    { label: `${call.purpose} user prompt`, text: call.prompt },
    ...(call.toolCalls.length > 0
      ? [{
        label: `${call.purpose} tool calls`,
        text: call.toolCalls.map(({ toolName, input }) => `${toolName} ${input}`).join("\n"),
      }]
      : []),
  ]);

  return (
    <SingleColumnSection className={classes.page}>
      <header className={classes.header}>
        <div className={classes.eyebrow}>Internal tool</div>
        <h1 className={classes.title}>AI digest workbench</h1>
        <p className={classes.intro}>
          Generate, compare, and inspect personalized LessWrong digests.
          Samples are stored as reusable issues.
        </p>
      </header>

      <>
          <div className={classes.toolbar}>
            <div className={classes.field}>
              <span className={classes.label}>Reader</span>
              <div className={classes.userSearch}>
                <ErrorBoundary>
                  <UsersSearchAutoComplete
                    clickAction={handleSelectReader}
                    label={`Search for a reader (current: ${activeSlug})`}
                    facetFilters={includeNonAdmins ? undefined : { isAdmin: true }}
                  />
                </ErrorBoundary>
              </div>
            </div>
            <label className={classes.field}>
              <span className={classes.label}>New samples</span>
              <select
                className={classes.select}
                value={sampleCount}
                onChange={(event) => setSampleCount(Number(event.target.value))}
                disabled={samplesLoading}
              >
                <option value={1}>1 sample</option>
                <option value={2}>2 samples</option>
                <option value={3}>3 samples</option>
              </select>
            </label>
            <button
              className={classNames(classes.button, classes.primaryButton)}
              type="button"
              onClick={handleGenerateSamples}
              disabled={samplesLoading}
            >
              {samplesLoading ? "Generating…" : `Generate ${sampleCount}`}
            </button>
            <label className={classes.toolbarOption}>
              <input
                type="checkbox"
                checked={includeNonAdmins}
                onChange={(event) => setIncludeNonAdmins(event.target.checked)}
              />
              <span>Include non-admins in reader search</span>
            </label>
            <label className={classes.toolbarOption}>
              <input
                type="checkbox"
                checked={countsTowardHistory}
                disabled={samplesLoading}
                onChange={(event) => setCountsTowardHistory(event.target.checked)}
              />
              <span>Count generated samples toward recommendation history</span>
            </label>
          </div>

          <div className={classes.historyAdminBar}>
            <span>Clear counted history for {activeSlug} from the last</span>
            <input
              className={classes.historyDaysInput}
              type="number"
              min={1}
              max={AI_DIGEST_CLEAR_HISTORY_MAX_DAYS}
              value={historyClearDays}
              disabled={historyClearLoading}
              aria-label="Days of recommendation history to clear"
              onChange={(event) => {
                const days = Number(event.target.value);
                setHistoryClearDays(Math.max(1, Math.min(AI_DIGEST_CLEAR_HISTORY_MAX_DAYS, days)));
              }}
            />
            <span>days</span>
            <button
              type="button"
              className={classes.button}
              disabled={historyClearLoading}
              onClick={handleClearSampleHistory}
            >
              {historyClearLoading ? "Clearing…" : "Clear history"}
            </button>
          </div>

          {samplesLoading && (
            <div className={classes.generationStatus}>
              Generating {sampleCount} {sampleCount === 1 ? "sample" : "samples"} in
              parallel. This can take several minutes.
            </div>
          )}
          {samplesError && (
            <p className={classes.error}>
              Could not generate samples: {samplesError.message}
            </p>
          )}
          {historyClearError && (
            <p className={classes.error}>
              Could not clear recommendation history: {historyClearError.message}
            </p>
          )}
          {historyMessage && (
            <div className={classes.generationStatus}>{historyMessage}</div>
          )}

          <div className={classes.workbench}>
            <aside className={classes.sidebar}>
              <div className={classes.sidebarHeader}>
                <h2 className={classes.sidebarTitle}>{activeSlug}</h2>
                <span className={classes.sampleCount}>
                  {storedSamples.length} stored
                </span>
              </div>
              {storedSamplesLoading && <Loading />}
              {storedSamplesError && (
                <p className={classes.error}>
                  Could not load samples: {storedSamplesError.message}
                </p>
              )}
              {!storedSamplesLoading && !storedSamplesError && storedSamples.length === 0 && (
                <div className={classes.emptyState}>No stored samples for this reader.</div>
              )}
              {storedSamples.length > 0 && (
                <div className={classes.sampleList}>
                  {storedSamples.map((sample) => (
                    <button
                      key={sample._id}
                      type="button"
                      className={classNames(
                        classes.sampleRow,
                        sample._id === effectiveSelectedIssueId
                          && classes.sampleRowSelected,
                      )}
                      onClick={() => selectIssue(sample._id)}
                    >
                      <span className={classes.sampleSubject}>
                        {sample.subject}
                        {!sample.countsTowardHistory && (
                          <> <span className={classes.scratchLabel}>scratch</span></>
                        )}
                      </span>
                      <span className={classes.sampleMetadata}>
                        {formatSampleListDate(sample.createdAt)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </aside>

            <main className={classes.previewPanel}>
              <div className={classes.previewHeader}>
                <div className={classes.previewTitle}>
                  {selectedSampleSummary?.subject ?? "Select a stored sample"}
                </div>
                <div className={classes.previewControls}>
                  <div className={classes.previewTabs} role="tablist" aria-label="Preview format">
                    {SAMPLE_PREVIEW_VIEWS.map((previewView) => (
                      <button
                        key={previewView}
                        type="button"
                        role="tab"
                        aria-selected={samplePreviewView === previewView}
                        className={classNames(
                          classes.previewTab,
                          samplePreviewView === previewView && classes.previewTabSelected,
                        )}
                        onClick={() => setSamplePreviewView(previewView)}
                      >
                        {previewView === "html"
                          ? "Email"
                          : previewView === "text" ? "Plain text" : "Metadata"}
                      </button>
                    ))}
                  </div>
                  {samplePreviewView === "html" && (
                    <ViewportToggle
                      viewport={previewViewport}
                      setViewport={setPreviewViewport}
                    />
                  )}
                  {selectedSampleSummary && (
                    <button
                      type="button"
                      className={classes.promptToggle}
                      aria-expanded={promptsExpanded}
                      onClick={() => setPromptsExpanded(!promptsExpanded)}
                    >
                      {promptsExpanded ? "Hide prompts" : "Show prompts"}
                    </button>
                  )}
                </div>
              </div>
              {promptsExpanded && selectedSampleDetails && (
                <div className={classes.promptPanel}>
                  {storedPrompts.map(({ label, text }) => (
                    <section key={label} className={classes.promptSection}>
                      <h3 className={classes.promptTitle}>{label}</h3>
                      <pre className={classes.promptText}>{text}</pre>
                    </section>
                  ))}
                </div>
              )}
              <div className={classes.previewBody}>
                {selectedSampleLoading && <Loading />}
                {selectedSampleError && (
                  <p className={classes.error}>
                    Could not render stored sample: {selectedSampleError.message}
                  </p>
                )}
                {!selectedSampleLoading && !selectedSample && (
                  <div className={classes.emptyState}>
                    Choose a saved issue from the list or generate a new one.
                  </div>
                )}
                {!selectedSampleLoading && selectedSample && samplePreviewView !== "metadata" && (
                  <EmailPreview
                    email={selectedSample}
                    bodyView={samplePreviewView}
                    viewport={previewViewport}
                    fullHeight
                  />
                )}
                {selectedSampleSummary && selectedSample && samplePreviewView === "metadata" && (
                  <dl className={classes.metadataGrid}>
                    {metadata.map(([label, value]) => (
                      <React.Fragment key={label}>
                        <dt className={classes.metadataLabel}>{label}</dt>
                        <dd className={classes.metadataValue}>{value}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                )}
              </div>
            </main>
          </div>
      </>
    </SingleColumnSection>
  );
}
