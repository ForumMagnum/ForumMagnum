"use client";

import React, { useState } from "react";
import { useMutation } from "@apollo/client/react";
import classNames from "classnames";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import ErrorAccessDenied from "@/components/common/ErrorAccessDenied";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { useCurrentUser } from "@/components/common/withUser";
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
      trigger
      personalInstructions
    }
    ContentForYouGenerationStatus {
      nextAllowedAt
      generatedInLast24Hours
      dailyLimit
    }
  }
`);

const ContentForYouIssueQuery = gql(`
  query ContentForYouIssueQuery($issueId: String!) {
    ContentForYouIssue(issueId: $issueId) {
      issueId
      subject
      generatedAt
      trigger
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
  mutation GenerateContentForYouIssueMutation {
    GenerateContentForYouIssue {
      issue {
        issueId
        subject
        generatedAt
        trigger
        personalInstructions
      }
      nextAllowedAt
    }
  }
`);

const ISSUE_LIMIT = 24;
const INSTRUCTION_MAX_LENGTH = 2_000;
const EDITION_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const GENERATION_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const styles = defineStyles("ContentForYouPage", (theme: ThemeType) => ({
  page: {
    width: "calc(100vw - 32px)",
    maxWidth: 760,
    paddingBottom: 80,
    [theme.breakpoints.down("xs")]: {
      width: "calc(100vw - 20px)",
    },
  },
  masthead: {
    display: "flex",
    alignItems: "center",
    gap: 13,
    margin: "44px 0 0",
    padding: "19px 0 18px",
    borderTop: `4px solid ${theme.palette.primary.main}`,
    borderBottom: theme.palette.border.normal,
  },
  compass: {
    width: 34,
    height: 34,
    flexShrink: 0,
    color: theme.palette.text.normal,
  },
  lessWrong: {
    ...theme.typography.headerStyle,
    fontSize: 27,
    fontWeight: 600,
    lineHeight: 1,
  },
  productName: {
    marginTop: 5,
    color: theme.palette.primary.main,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.16em",
    lineHeight: 1,
    textTransform: "uppercase",
  },
  intro: {
    maxWidth: 620,
    margin: "22px 0 34px",
    color: theme.palette.text.dim2,
    ...theme.typography.postStyle,
    fontSize: 17,
    lineHeight: 1.55,
  },
  instructionsPanel: {
    position: "relative",
    marginBottom: 42,
    padding: "25px 27px 23px",
    overflow: "hidden",
    border: theme.palette.border.normal,
    borderRadius: 5,
    background: theme.palette.panelBackground.default,
    boxShadow: `0 16px 44px ${theme.palette.greyAlpha(0.06)}`,
    "&:before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      width: 4,
      height: "100%",
      background: theme.palette.primary.main,
    },
    [theme.breakpoints.down("xs")]: {
      padding: "21px 19px 20px 22px",
    },
  },
  instructionsHeading: {
    margin: "0 0 5px",
    ...theme.typography.headerStyle,
    fontSize: 21,
    fontWeight: 500,
  },
  instructionsDescription: {
    margin: "0 0 15px",
    color: theme.palette.text.dim3,
    fontSize: 13,
    lineHeight: 1.5,
  },
  textarea: {
    display: "block",
    width: "100%",
    minHeight: 132,
    boxSizing: "border-box",
    padding: "13px 14px",
    resize: "vertical",
    border: theme.palette.border.normal,
    borderRadius: 3,
    outline: "none",
    background: theme.palette.background.default,
    color: theme.palette.text.normal,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: 1.5,
    "&:focus": {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${theme.palette.background.primaryTranslucent}`,
    },
  },
  editorFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 8,
    [theme.breakpoints.down("xs")]: {
      alignItems: "flex-start",
      flexDirection: "column",
    },
  },
  characterCount: {
    color: theme.palette.text.dim3,
    fontSize: 11,
    whiteSpace: "nowrap",
  },
  actions: {
    display: "flex",
    gap: 9,
    [theme.breakpoints.down("xs")]: {
      width: "100%",
    },
  },
  button: {
    minHeight: 36,
    padding: "8px 15px",
    border: theme.palette.border.normal,
    borderRadius: 3,
    background: theme.palette.panelBackground.default,
    color: theme.palette.text.normal,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    "&:hover": {
      background: theme.palette.panelBackground.hoverHighlightGrey,
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "default",
    },
    [theme.breakpoints.down("xs")]: {
      flex: 1,
    },
  },
  primaryButton: {
    borderColor: theme.palette.primary.main,
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    "&:hover": {
      background: theme.palette.primary.dark,
    },
  },
  status: {
    margin: "15px 0 0",
    paddingTop: 12,
    borderTop: theme.palette.border.faint,
    color: theme.palette.text.dim3,
    fontSize: 12,
    lineHeight: 1.45,
  },
  success: {
    color: theme.palette.primary.dark,
    fontWeight: 600,
  },
  error: {
    color: theme.palette.error.main,
  },
  generating: {
    color: theme.palette.text.normal,
    fontStyle: "italic",
  },
  editionToolbar: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 18,
    marginBottom: 18,
    paddingBottom: 13,
    borderBottom: theme.palette.border.normal,
    [theme.breakpoints.down("xs")]: {
      alignItems: "stretch",
      flexDirection: "column",
    },
  },
  editionEyebrow: {
    marginBottom: 4,
    color: theme.palette.text.dim3,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.13em",
    textTransform: "uppercase",
  },
  editionTitle: {
    margin: 0,
    ...theme.typography.headerStyle,
    fontSize: 25,
    fontWeight: 500,
    lineHeight: 1.2,
  },
  select: {
    width: 250,
    maxWidth: "100%",
    height: 36,
    padding: "7px 30px 7px 10px",
    border: theme.palette.border.normal,
    borderRadius: 3,
    background: theme.palette.panelBackground.default,
    color: theme.palette.text.normal,
    fontSize: 12,
    [theme.breakpoints.down("xs")]: {
      width: "100%",
    },
  },
  issueMeta: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
    color: theme.palette.text.dim3,
    fontSize: 12,
  },
  issueBadge: {
    padding: "3px 8px",
    borderRadius: 20,
    background: theme.palette.background.primaryTranslucent,
    color: theme.palette.primary.dark,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  instructionsSnapshot: {
    margin: "0 0 24px",
    padding: "11px 14px",
    border: theme.palette.border.faint,
    borderRadius: 3,
    background: theme.palette.panelBackground.darken03,
    color: theme.palette.text.dim2,
    fontSize: 12.5,
    lineHeight: 1.5,
    "& summary": {
      cursor: "pointer",
      color: theme.palette.text.dim3,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
    },
    "& p": {
      margin: "10px 0 2px",
      whiteSpace: "pre-wrap",
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
  saveLoading: boolean;
  generationLoading: boolean;
  nextAllowedAt: string | null;
  message: string | null;
  errorMessage: string | null;
  onSave: (instructions: string) => void;
  onSaveAndGenerate: (instructions: string) => void;
}

function CompassRoseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <path
        fill="currentColor"
        d="M29.1,29.2l6.4,11.6l4.3-0.8l0.8-4.3L29.1,29.2z M40.7,64.5l-0.8-4.3l-4.3-0.8L29.2,71L40.7,64.5z M70.9,70.9l-6.4-11.6l-4.3,0.8l-0.8,4.3L70.9,70.9z M64.4,40.8l6.4-11.6l-11.6,6.4l0.8,4.3L64.4,40.8z M67.4,58.8l10.8,19.4L58.8,67.4L50,98.8l-8.8-31.4L21.9,78.2l10.8-19.4L1.2,50.1l31.4-8.8L21.9,21.9l19.4,10.8L50,1.3l8.8,31.4l19.4-10.8L67.4,41.3L98.8,50L67.4,58.8zM57.7,57.8L83.5,50L50,50.1l7.7-7.7L50,16.6v33.5l-7.7-7.7l-25.8,7.7H50l-7.7,7.7L50,83.5V50.1L57.7,57.8z"
      />
    </svg>
  );
}

function issueTypeLabel(trigger: string): string {
  if (trigger === "scheduled") {
    return "Email edition";
  }
  if (trigger === "userPreview") {
    return "Sample";
  }
  return "Prototype";
}

function formatEditionDate(timestamp: string): string {
  return EDITION_DATE_FORMATTER.format(new Date(timestamp));
}

function formatGenerationTime(timestamp: string): string {
  return GENERATION_TIME_FORMATTER.format(new Date(timestamp));
}

function InstructionsEditor({
  savedInstructions,
  saveLoading,
  generationLoading,
  nextAllowedAt,
  message,
  errorMessage,
  onSave,
  onSaveAndGenerate,
}: InstructionsEditorProps) {
  const classes = useStyles(styles);
  const [instructions, setInstructions] = useState(savedInstructions);
  const normalizedInstructions = instructions.trim();
  const isDirty = normalizedInstructions !== savedInstructions.trim();
  const isBusy = saveLoading || generationLoading;
  const rateLimited = !!nextAllowedAt;

  const handleSave = () => {
    onSave(normalizedInstructions);
  };
  const handleSaveAndGenerate = () => {
    onSaveAndGenerate(normalizedInstructions);
  };

  return (
    <section className={classes.instructionsPanel} aria-labelledby="digest-instructions-heading">
      <h2 id="digest-instructions-heading" className={classes.instructionsHeading}>
        Tune your recommendations
      </h2>
      <p className={classes.instructionsDescription}>
        Tell the AI what you want more of, what to avoid, or which questions and authors
        you want it to follow. These instructions take priority over inferred interests.
      </p>
      <textarea
        className={classes.textarea}
        value={instructions}
        maxLength={INSTRUCTION_MAX_LENGTH}
        onChange={(event) => setInstructions(event.target.value)}
        placeholder="For example: More technical alignment work and decision theory. Include good comments I may have missed. Fewer introductory AI governance posts."
        aria-label="Personal instructions for Content for You"
      />
      <div className={classes.editorFooter}>
        <span className={classes.characterCount}>
          {instructions.length.toLocaleString()} / {INSTRUCTION_MAX_LENGTH.toLocaleString()}
        </span>
        <div className={classes.actions}>
          <button
            type="button"
            className={classes.button}
            disabled={!isDirty || isBusy}
            onClick={handleSave}
          >
            {saveLoading && !generationLoading ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className={classNames(classes.button, classes.primaryButton)}
            disabled={isBusy || rateLimited}
            onClick={handleSaveAndGenerate}
          >
            {generationLoading ? "Generating…" : "Save & generate sample"}
          </button>
        </div>
      </div>
      <div className={classes.status} aria-live="polite">
        {generationLoading ? (
          <span className={classes.generating}>
            Selecting and writing your sample. This usually takes one or two minutes;
            you can leave this page open while it works.
          </span>
        ) : rateLimited && nextAllowedAt ? (
          <span>
            You can generate another sample after {formatGenerationTime(nextAllowedAt)}.
          </span>
        ) : (
          <span>Sample generation is unrestricted while this page is in admin preview.</span>
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
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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

  const issues = overviewData?.ContentForYouIssues ?? [];
  const effectiveIssueId = selectedIssueId
    && issues.some((issue) => issue.issueId === selectedIssueId)
    ? selectedIssueId
    : issues[0]?.issueId ?? null;
  const selectedSummary = issues.find((issue) => issue.issueId === effectiveIssueId) ?? null;
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

  const handleSave = (instructions: string) => {
    if (!currentUser) {
      return;
    }
    setMessage(null);
    void updateInstructions({
      variables: {
        selector: { _id: currentUser._id },
        data: {
          aiDigestPersonalInstructions: instructions || null,
        },
      },
    }).then(() => {
      setMessage("Your instructions were saved.");
      void refetchOverview();
    }, () => undefined);
  };

  const handleSaveAndGenerate = (instructions: string) => {
    if (!currentUser) {
      return;
    }
    setMessage(null);
    void updateInstructions({
      variables: {
        selector: { _id: currentUser._id },
        data: {
          aiDigestPersonalInstructions: instructions || null,
        },
      },
    }).then(() => generateIssue()).then(({ data }) => {
      const newIssueId = data?.GenerateContentForYouIssue.issue.issueId ?? null;
      setSelectedIssueId(newIssueId);
      setMessage("Your new sample is ready.");
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
  const mutationError = saveError ?? generationError;

  return (
    <SingleColumnSection className={classes.page}>
      <header className={classes.masthead}>
        <CompassRoseIcon className={classes.compass} />
        <div>
          <div className={classes.lessWrong}>LessWrong</div>
          <div className={classes.productName}>Content for You</div>
        </div>
      </header>
      <p className={classes.intro}>
        A weekly, personalized reading list of worthwhile LessWrong posts and discussions
        you may not have seen. You can steer the assistant directly, then preview what it
        would choose for you.
      </p>

      {overviewLoading ? <Loading /> : (
        <InstructionsEditor
          key={savedInstructions}
          savedInstructions={savedInstructions}
          saveLoading={saveLoading}
          generationLoading={generationLoading}
          nextAllowedAt={generationStatus?.nextAllowedAt ?? null}
          message={message}
          errorMessage={mutationError?.message ?? null}
          onSave={handleSave}
          onSaveAndGenerate={handleSaveAndGenerate}
        />
      )}

      {overviewError && (
        <p className={classes.error}>Could not load Content for You: {overviewError.message}</p>
      )}

      {!overviewLoading && !overviewError && issues.length === 0 && (
        <div className={classes.emptyState}>
          Save your preferences and generate a sample to create your first edition.
        </div>
      )}

      {issues.length > 0 && (
        <>
          <div className={classes.editionToolbar}>
            <div>
              <div className={classes.editionEyebrow}>Your reading list</div>
              <h1 className={classes.editionTitle}>Current edition</h1>
            </div>
            <select
              className={classes.select}
              value={effectiveIssueId ?? ""}
              onChange={(event) => setSelectedIssueId(event.target.value)}
              aria-label="Choose an edition"
            >
              {issues.map((issue) => (
                <option key={issue.issueId} value={issue.issueId}>
                  {formatEditionDate(issue.generatedAt)} · {issue.subject}
                </option>
              ))}
            </select>
          </div>

          {selectedSummary && (
            <div className={classes.issueMeta}>
              <span className={classes.issueBadge}>{issueTypeLabel(selectedSummary.trigger)}</span>
              <span>{formatEditionDate(selectedSummary.generatedAt)}</span>
            </div>
          )}

          {selectedIssue && (
            <details className={classes.instructionsSnapshot}>
              <summary>Instructions used for this edition</summary>
              <p>
                {selectedIssue.personalInstructions
                  || "No additional personal instructions were supplied."}
              </p>
            </details>
          )}

          {issueLoading && <Loading />}
          {issueError && (
            <p className={classes.error}>Could not load this edition: {issueError.message}</p>
          )}
          {!issueLoading && selectedIssue && (
            <AiDigestIssueView spec={selectedIssue.spec} />
          )}
        </>
      )}
    </SingleColumnSection>
  );
}
