"use client";

import React, { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { aiDigestPresentation } from "@/lib/aiDigest/aiDigestPresentation";
import type { SettingsOption } from "@/lib/collections/posts/dropdownOptions";
import ErrorAccessDenied from "@/components/common/ErrorAccessDenied";
import ForumDropdown from "@/components/common/ForumDropdown";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { useCurrentUser } from "@/components/common/withUser";
import { useUpdateCurrentUser } from "@/components/hooks/useUpdateCurrentUser";
import { useMessages } from "@/components/common/withMessages";
import Loading from "@/components/vulcan-core/Loading";
import { AiDigestIssueView } from "./AiDigestIssueView";

const ContentForYouOverviewQuery = gql(`
  query ContentForYouOverview($userId: String!, $limit: Int) {
    user(selector: { _id: $userId }) {
      result {
        _id
        aiDigestPersonalInstructions
      }
    }
    ContentForYouIssues(limit: $limit) {
      issueId
      subject
      generatedAt
      countsTowardHistory
      personalInstructions
    }
    ContentForYouGenerationStatus {
      nextAllowedAt
      remainingThisHour
      typicalDurationMsLow
      typicalDurationMsHigh
    }
  }
`);

const ContentForYouIssueQuery = gql(`
  query ContentForYouIssueQuery($issueId: String!) {
    ContentForYouIssue(issueId: $issueId) {
      issueId
      subject
      generatedAt
      countsTowardHistory
      personalInstructions
      spec
    }
  }
`);

const UpdateContentForYouInstructionsMutation = gql(`
  mutation UpdateContentForYouInstructions(
    $selector: SelectorInput!
    $data: UpdateUserDataInput!
  ) {
    updateUser(selector: $selector, data: $data) {
      data {
        _id
        aiDigestPersonalInstructions
      }
    }
  }
`);

const GenerateContentForYouIssueMutation = gql(`
  mutation GenerateContentForYouIssueMutation($countsTowardHistory: Boolean) {
    GenerateContentForYouIssue(countsTowardHistory: $countsTowardHistory) {
      issue {
        issueId
        subject
        generatedAt
        countsTowardHistory
        personalInstructions
      }
      nextAllowedAt
    }
  }
`);

const ClearContentForYouRecommendationHistoryMutation = gql(`
  mutation ClearContentForYouRecommendationHistoryMutation($days: Int!) {
    ClearContentForYouRecommendationHistory(days: $days)
  }
`);

const ISSUE_LIMIT = 24;
const INSTRUCTION_MAX_LENGTH = 2_000;
const CHARACTER_COUNT_VISIBLE_FROM = INSTRUCTION_MAX_LENGTH * 0.8;
const DEFAULT_HISTORY_CLEAR_DAYS = 30;
const MAX_HISTORY_CLEAR_DAYS = 3_650;
const GENERATION_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const RATE_LIMIT_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const styles = defineStyles("ContentForYouPage", (theme: ThemeType) => ({
  page: {
    width: "calc(100vw - 32px)",
    maxWidth: 760,
    paddingBottom: 80,
    fontFamily: theme.palette.fonts.sansSerifStack,
    // Form controls don't inherit fonts by default
    "& button, & input, & select, & textarea": {
      fontFamily: "inherit",
    },
    [theme.breakpoints.down("xs")]: {
      width: "calc(100vw - 20px)",
    },
  },
  pageTitle: {
    margin: "18px 0 8px",
    ...theme.typography.headerStyle,
    fontSize: 30,
    fontWeight: 500,
    lineHeight: 1.2,
  },
  intro: {
    margin: "0 0 30px",
    color: theme.palette.text.dim2,
    fontSize: 15,
    lineHeight: 1.55,
  },
  subscriptionToggle: {
    background: "none",
    border: "none",
    padding: 0,
    font: "inherit",
    cursor: "pointer",
    color: theme.palette.primary.main,
    "&:hover": {
      color: theme.palette.primary.dark,
    },
    "&:disabled": {
      cursor: "default",
      opacity: 0.7,
    },
  },
  instructionsPanel: {
    marginBottom: 36,
  },
  instructionsHeading: {
    margin: "0 0 10px",
    color: theme.palette.grey[800],
    fontSize: aiDigestPresentation.aiNote.labelFontSize,
    fontWeight: aiDigestPresentation.aiNote.labelFontWeight,
    letterSpacing: aiDigestPresentation.aiNote.labelLetterSpacing,
    lineHeight: aiDigestPresentation.aiNote.labelLineHeight,
    textTransform: "uppercase",
  },
  textarea: {
    display: "block",
    width: "100%",
    minHeight: 120,
    boxSizing: "border-box",
    padding: "13px 14px",
    resize: "vertical",
    border: theme.palette.border.normal,
    borderRadius: 3,
    outline: "none",
    background: theme.palette.panelBackground.default,
    color: theme.palette.text.normal,
    fontSize: 14,
    lineHeight: 1.5,
    "&:focus": {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${theme.palette.background.primaryTranslucent}`,
    },
    "&:disabled": {
      opacity: 0.6,
    },
  },
  editorFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 12,
    [theme.breakpoints.down("xs")]: {
      alignItems: "flex-start",
      flexDirection: "column",
    },
  },
  quota: {
    color: theme.palette.text.dim3,
    fontSize: 12,
    lineHeight: 1.45,
  },
  characterCount: {
    marginLeft: 10,
    color: theme.palette.text.dim3,
    fontSize: 11,
    whiteSpace: "nowrap",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    gap: 14,
  },
  historyOption: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    color: theme.palette.text.dim2,
    cursor: "pointer",
    fontSize: 12,
    lineHeight: 1.4,
    "& input": {
      margin: 0,
    },
  },
  primaryButton: {
    minHeight: 36,
    padding: "8px 20px",
    border: "none",
    borderRadius: 4,
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    boxShadow: `0 1px 3px ${theme.palette.boxShadowColor(0.15)}`,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    "&:hover": {
      background: theme.palette.primary.dark,
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "default",
    },
  },
  statusMessage: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 1.45,
  },
  success: {
    color: theme.palette.primary.dark,
    fontWeight: 600,
  },
  waiting: {
    color: theme.palette.text.dim2,
  },
  error: {
    color: theme.palette.error.main,
  },
  generatedRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    marginBottom: 4,
  },
  generatedDropdown: {
    flexShrink: 0,
  },
  adminTools: {
    marginTop: 44,
    color: theme.palette.text.dim3,
    fontSize: 12,
    "& summary": {
      cursor: "pointer",
      fontWeight: 600,
    },
  },
  adminToolsRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
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
    background: theme.palette.background.default,
    color: theme.palette.text.normal,
  },
  clearHistoryButton: {
    minHeight: 30,
    padding: "5px 10px",
    border: theme.palette.border.normal,
    borderRadius: 3,
    background: theme.palette.panelBackground.default,
    color: theme.palette.error.main,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 600,
    "&:disabled": {
      opacity: 0.5,
      cursor: "default",
    },
  },
  emptyState: {
    padding: "50px 24px",
    borderTop: theme.palette.border.normal,
    color: theme.palette.text.dim3,
    textAlign: "center",
  },
}));

interface InstructionsEditorProps {
  savedInstructions: string;
  disabled: boolean;
  saveLoading: boolean;
  generationLoading: boolean;
  nextAllowedAt: string | null;
  remainingThisHour: number | null;
  typicalDurationMsLow: number | null;
  typicalDurationMsHigh: number | null;
  showRemainingQuota: boolean;
  isAdmin: boolean;
  message: string | null;
  errorMessage: string | null;
  onSaveAndGenerate: (instructions: string, countsTowardHistory: boolean) => void;
}

function formatGenerationTime(timestamp: string): string {
  return GENERATION_TIME_FORMATTER.format(new Date(timestamp));
}

function formatRateLimitTime(timestamp: string): string {
  return RATE_LIMIT_TIME_FORMATTER.format(new Date(timestamp));
}

function generationsLeftLabel(remainingThisHour: number): string {
  return remainingThisHour === 1
    ? "1 generation left this hour"
    : `${remainingThisHour.toLocaleString()} generations left this hour`;
}

function formatTypicalDurationRange(
  lowMs: number | null,
  highMs: number | null,
): string {
  if (!lowMs || !highMs) {
    return "a minute or two";
  }
  // Floor the low bound and ceil the high bound so the promise stays generous
  const lowMinutes = Math.max(1, Math.floor(lowMs / 60_000));
  const highMinutes = Math.max(lowMinutes, Math.ceil(highMs / 60_000));
  if (lowMinutes === highMinutes) {
    return lowMinutes === 1 ? "about a minute" : `about ${lowMinutes} minutes`;
  }
  return `${lowMinutes}–${highMinutes} minutes`;
}

function InstructionsEditor({
  savedInstructions,
  disabled,
  saveLoading,
  generationLoading,
  nextAllowedAt,
  remainingThisHour,
  typicalDurationMsLow,
  typicalDurationMsHigh,
  showRemainingQuota,
  isAdmin,
  message,
  errorMessage,
  onSaveAndGenerate,
}: InstructionsEditorProps) {
  const classes = useStyles(styles);
  const [editedInstructions, setEditedInstructions] = useState<string | null>(null);
  const [countsTowardHistory, setCountsTowardHistory] = useState(true);
  const instructions = editedInstructions ?? savedInstructions;
  const isBusy = saveLoading || generationLoading;
  const rateLimited = !!nextAllowedAt;

  const handleSaveAndGenerate = () => {
    onSaveAndGenerate(instructions.trim(), countsTowardHistory);
  };

  return (
    <section className={classes.instructionsPanel} aria-labelledby="digest-instructions-heading">
      <h2 id="digest-instructions-heading" className={classes.instructionsHeading}>
        Tune your recommendations
      </h2>
      <textarea
        className={classes.textarea}
        value={instructions}
        maxLength={INSTRUCTION_MAX_LENGTH}
        disabled={disabled}
        onChange={(event) => setEditedInstructions(event.target.value)}
        placeholder="For example: More technical alignment work and decision theory. Include good comments I may have missed. Fewer introductory AI governance posts."
        aria-label="Personal instructions for Content for You"
      />
      <div className={classes.editorFooter}>
        <span className={classes.quota}>
          {rateLimited && nextAllowedAt
            ? `No generations left this hour. You can generate again after ${formatRateLimitTime(nextAllowedAt)}.`
            : showRemainingQuota && remainingThisHour !== null
              ? generationsLeftLabel(remainingThisHour)
              : null}
          {instructions.length > CHARACTER_COUNT_VISIBLE_FROM && (
            <span className={classes.characterCount}>
              {instructions.length.toLocaleString()} / {INSTRUCTION_MAX_LENGTH.toLocaleString()}
            </span>
          )}
        </span>
        <div className={classes.actions}>
          {isAdmin && (
            <label className={classes.historyOption}>
              <input
                type="checkbox"
                checked={countsTowardHistory}
                disabled={disabled || isBusy}
                onChange={(event) => setCountsTowardHistory(event.target.checked)}
              />
              <span>Counts toward history</span>
            </label>
          )}
          <button
            type="button"
            className={classes.primaryButton}
            disabled={disabled || isBusy || rateLimited}
            onClick={handleSaveAndGenerate}
          >
            {isBusy ? "Generating…" : "Save & generate"}
          </button>
        </div>
      </div>
      <div className={classes.statusMessage} aria-live="polite">
        {isBusy && (
          <div className={classes.waiting}>
            Generations typically take{" "}
            {formatTypicalDurationRange(typicalDurationMsLow, typicalDurationMsHigh)}.
            You will be notified when it completes.
          </div>
        )}
        {message && <div className={classes.success}>{message}</div>}
        {errorMessage && <div className={classes.error}>{errorMessage}</div>}
      </div>
    </section>
  );
}

export function ContentForYouPage() {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const hasAccess = userIsAdmin(currentUser);
  const isAdmin = userIsAdmin(currentUser);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hasGeneratedThisSession, setHasGeneratedThisSession] = useState(false);
  const [historyClearDays, setHistoryClearDays] = useState(DEFAULT_HISTORY_CLEAR_DAYS);
  const updateCurrentUser = useUpdateCurrentUser();
  const { flash } = useMessages();
  const [subscriptionUpdating, setSubscriptionUpdating] = useState(false);
  const isSubscribed = !!currentUser?.emailSubscribedToAiDigest;
  const {
    data: overviewData,
    loading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useQuery(ContentForYouOverviewQuery, {
    variables: {
      userId: currentUser?._id ?? "",
      limit: ISSUE_LIMIT,
    },
    skip: !hasAccess,
    ssr: false,
    fetchPolicy: "network-only",
  });
  const [updateInstructions, {
    loading: saveLoading,
    error: saveError,
  }] = useMutation(UpdateContentForYouInstructionsMutation);
  const [generateIssue, {
    loading: generationLoading,
    error: generationError,
  }] = useMutation(GenerateContentForYouIssueMutation);
  const [clearRecommendationHistory, {
    loading: historyClearLoading,
    error: historyClearError,
  }] = useMutation(ClearContentForYouRecommendationHistoryMutation);

  const issues = overviewData?.ContentForYouIssues ?? [];
  const effectiveIssueId = selectedIssueId
    && issues.some((issue) => issue.issueId === selectedIssueId)
    ? selectedIssueId
    : issues[0]?.issueId ?? null;
  const generationOptions: Record<string, SettingsOption> = Object.fromEntries(
    issues.map((issue) => [issue.issueId, {
      label: `${isAdmin && !issue.countsTowardHistory ? "Not counted · " : ""}${formatGenerationTime(issue.generatedAt)} · ${issue.subject}`,
      shortLabel: formatGenerationTime(issue.generatedAt),
    }]),
  );
  const {
    data: issueData,
    loading: issueLoading,
    error: issueError,
  } = useQuery(ContentForYouIssueQuery, {
    variables: { issueId: effectiveIssueId ?? "" },
    skip: !hasAccess || !effectiveIssueId,
    ssr: false,
    fetchPolicy: "network-only",
  });

  const handleSaveAndGenerate = (
    instructions: string,
    countsTowardHistory: boolean,
  ) => {
    if (!currentUser) {
      return;
    }
    setMessage(null);
    setHasGeneratedThisSession(true);
    void updateInstructions({
      variables: {
        selector: { _id: currentUser._id },
        data: {
          aiDigestPersonalInstructions: instructions || null,
        },
      },
    }).then(() => generateIssue({
      variables: {
        countsTowardHistory,
      },
    })).then(({ data }) => {
      const newIssueId = data?.GenerateContentForYouIssue.issue.issueId ?? null;
      setSelectedIssueId(newIssueId);
      setMessage("Your new recommendations are ready.");
      void refetchOverview();
    }, () => undefined);
  };

  const handleToggleSubscription = () => {
    const subscribing = !isSubscribed;
    setSubscriptionUpdating(true);
    void updateCurrentUser({
      emailSubscribedToAiDigest: subscribing,
    }).then(() => {
      flash({
        messageString: subscribing ? "You are now subscribed" : "You are now unsubscribed",
        type: "success",
      });
    }, () => {
      flash({
        messageString: "Could not update subscription",
        type: "error",
      });
    }).finally(() => setSubscriptionUpdating(false));
  };

  const handleClearRecommendationHistory = () => {
    if (!window.confirm(
      `Delete counted history from the last ${historyClearDays} days? `
      + "Generations that don't count toward history will be kept.",
    )) {
      return;
    }
    setMessage(null);
    void clearRecommendationHistory({
      variables: {
        days: historyClearDays,
      },
    }).then(({ data }) => {
      const deletedCount = data?.ClearContentForYouRecommendationHistory ?? 0;
      setSelectedIssueId(null);
      setMessage(
        `Cleared ${deletedCount} counted ${deletedCount === 1 ? "generation" : "generations"} `
        + `from the last ${historyClearDays} days.`,
      );
      void refetchOverview();
    }, () => undefined);
  };

  if (!hasAccess) {
    return (
      <ErrorAccessDenied explanation="Content for You is currently available only to admin accounts." />
    );
  }

  const savedInstructions =
    overviewData?.user?.result?.aiDigestPersonalInstructions ?? "";
  const generationStatus = overviewData?.ContentForYouGenerationStatus;
  const selectedIssue = issueData?.ContentForYouIssue;
  const mutationError = saveError ?? generationError ?? historyClearError;

  return (
    <SingleColumnSection className={classes.page}>
      <h1 className={classes.pageTitle}>Content for You</h1>
      <p className={classes.intro}>
        Personalized reading for you based on your read and upvote history.{" "}
        {isSubscribed ? (
          <>
            <button
              type="button"
              className={classes.subscriptionToggle}
              onClick={handleToggleSubscription}
              disabled={subscriptionUpdating}
            >
              You are subscribed
            </button>{" "}
            and will receive an email weekly.
          </>
        ) : (
          <>
            <button
              type="button"
              className={classes.subscriptionToggle}
              onClick={handleToggleSubscription}
              disabled={subscriptionUpdating}
            >
              Click here to subscribe
            </button>{" "}
            to a weekly email.
          </>
        )}
      </p>

      <InstructionsEditor
        savedInstructions={savedInstructions}
        disabled={overviewLoading}
        saveLoading={saveLoading}
        generationLoading={generationLoading}
        nextAllowedAt={generationStatus?.nextAllowedAt ?? null}
        remainingThisHour={generationStatus?.remainingThisHour ?? null}
        typicalDurationMsLow={generationStatus?.typicalDurationMsLow ?? null}
        typicalDurationMsHigh={generationStatus?.typicalDurationMsHigh ?? null}
        showRemainingQuota={hasGeneratedThisSession}
        isAdmin={isAdmin}
        message={message}
        errorMessage={mutationError?.message ?? null}
        onSaveAndGenerate={handleSaveAndGenerate}
      />

      {overviewError && (
        <p className={classes.error}>Could not load Content for You: {overviewError.message}</p>
      )}

      {!overviewLoading && !overviewError && issues.length === 0 && (
        <div className={classes.emptyState}>
          Press Save &amp; generate to create your first personalized reading list.
        </div>
      )}

      {issues.length > 0 && (
        <>
          <div className={classes.generatedRow}>
            <ForumDropdown
              value={effectiveIssueId ?? ""}
              options={generationOptions}
              onSelect={setSelectedIssueId}
              menuPlacement="bottom-end"
              className={classes.generatedDropdown}
            />
          </div>

          {issueLoading && <Loading />}
          {issueError && (
            <p className={classes.error}>Could not load this content: {issueError.message}</p>
          )}
          {!issueLoading && selectedIssue && (
            <AiDigestIssueView
              spec={selectedIssue.spec}
              personalInstructions={selectedIssue.personalInstructions}
            />
          )}
        </>
      )}

      {isAdmin && (
        <details className={classes.adminTools}>
          <summary>Admin tools</summary>
          <div className={classes.adminToolsRow}>
            <span>Clear counted history from the last</span>
            <input
              className={classes.historyDaysInput}
              type="number"
              min={1}
              max={MAX_HISTORY_CLEAR_DAYS}
              value={historyClearDays}
              disabled={historyClearLoading}
              aria-label="Days of recommendation history to clear"
              onChange={(event) => {
                const days = Number(event.target.value);
                setHistoryClearDays(Math.max(1, Math.min(MAX_HISTORY_CLEAR_DAYS, days)));
              }}
            />
            <span>days</span>
            <button
              type="button"
              className={classes.clearHistoryButton}
              disabled={historyClearLoading}
              onClick={handleClearRecommendationHistory}
            >
              {historyClearLoading ? "Clearing…" : "Clear history"}
            </button>
          </div>
        </details>
      )}
    </SingleColumnSection>
  );
}
