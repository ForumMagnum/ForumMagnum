import React, { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { registerComponent } from "../../lib/vulcan-lib/components";
import LWTooltip from "../common/LWTooltip";
import FormatDate from "../common/FormatDate";

type PangramCollection = "Posts" | "Comments";

// Must stay in sync with PANGRAM_MAX_CHARS in server/pangram.ts.
const PANGRAM_MAX_CHARS_DISPLAY = 50_000;

const RUN_PANGRAM_MUTATION = gql`
  mutation runPangramOnDocument($collectionName: String!, $documentId: String!, $revisionId: String) {
    runPangramOnDocument(collectionName: $collectionName, documentId: $documentId, revisionId: $revisionId) {
      status
      aiScore
      rawResponse
    }
  }
`;

interface PangramV3Response {
  headline?: string | null;
  prediction?: string | null;
  prediction_short?: string | null;
  fraction_ai?: number | null;
  fraction_ai_assisted?: number | null;
  fraction_human?: number | null;
  _truncated?: boolean | null;
  _originalCharCount?: number | null;
}

interface PangramFields {
  pangramAiScore?: number | null;
  pangramStatus?: string | null;
  pangramCheckedAt?: Date | string | null;
  pangramRawResponse?: PangramV3Response | null;
}

const styles = (theme: ThemeType) => ({
  root: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: 11,
    fontFamily: theme.typography.commentStyle.fontFamily,
    padding: "1px 6px",
    marginRight: 6,
    borderRadius: 3,
    cursor: "pointer",
    userSelect: "none",
    border: theme.palette.border.faint,
  },
  scoreLow: {
    background: theme.palette.background.primarySlightlyDim,
    color: theme.palette.text.normal,
  },
  scoreMid: {
    background: theme.palette.pangram.scoreMidBackground,
    color: theme.palette.text.normal,
  },
  scoreHigh: {
    background: theme.palette.pangram.scoreHighBackground,
    color: theme.palette.text.normal,
  },
  neutral: {
    background: theme.palette.panelBackground.default,
    color: theme.palette.text.dim,
  },
  error: {
    background: theme.palette.pangram.errorBackground,
    color: theme.palette.text.normal,
  },
  loading: {
    color: theme.palette.text.dim,
  },
  label: {
    fontWeight: 600,
    marginRight: 4,
  },
  fractionSep: {
    margin: "0 3px",
    opacity: 0.5,
  },
  aiFraction: {
    color: theme.palette.pangram.aiFraction,
    fontWeight: 600,
  },
  assistedFraction: {
    color: theme.palette.pangram.assistedFraction,
    fontWeight: 600,
  },
  humanFraction: {
    color: theme.palette.pangram.humanFraction,
    fontWeight: 600,
  },
  tooltipHeadline: {
    fontWeight: 600,
    marginBottom: 4,
  },
  tooltipPrediction: {
    marginBottom: 4,
  },
  tooltipBreakdown: {
    marginBottom: 4,
  },
});

// Thresholds picked by eye for quick visual scanning — tune based on mod feedback.
const scoreClass = (score: number, classes: ClassesType<typeof styles>) => {
  if (score >= 0.7) return classes.scoreHigh;
  if (score >= 0.3) return classes.scoreMid;
  return classes.scoreLow;
};

const pct = (x: number | null | undefined) =>
  typeof x === "number" ? `${Math.round(x * 100)}%` : "–";

const PangramBadge = ({
  contents,
  collectionName,
  documentId,
  revisionId,
  classes,
}: {
  contents: PangramFields | null | undefined;
  collectionName: PangramCollection;
  documentId: string;
  revisionId?: string | null;
  classes: ClassesType<typeof styles>;
}) => {
  const [runPangram, { loading }] = useMutation(RUN_PANGRAM_MUTATION, {
    refetchQueries: ["multiPostsQuery", "multiCommentsQuery"],
  });

  const [localResult, setLocalResult] = useState<{
    status: string;
    aiScore: number | null;
    rawResponse: PangramV3Response | null;
  } | null>(null);

  const status = localResult?.status ?? contents?.pangramStatus ?? null;
  const aiScore = localResult?.aiScore ?? contents?.pangramAiScore ?? null;
  const checkedAt = contents?.pangramCheckedAt ?? null;
  const raw: PangramV3Response | null =
    localResult?.rawResponse ?? contents?.pangramRawResponse ?? null;

  const fractionAi = typeof raw?.fraction_ai === "number" ? raw.fraction_ai : null;
  const fractionAssisted =
    typeof raw?.fraction_ai_assisted === "number" ? raw.fraction_ai_assisted : null;
  const fractionHuman = typeof raw?.fraction_human === "number" ? raw.fraction_human : null;

  const handleClick = async () => {
    if (loading) return;
    try {
      const result = await runPangram({ variables: { collectionName, documentId, revisionId } });
      const data = result.data?.runPangramOnDocument;
      if (data) {
        setLocalResult({
          status: data.status,
          aiScore: data.aiScore ?? null,
          rawResponse: data.rawResponse ?? null,
        });
      }
    } catch (e) {
      setLocalResult({ status: "error", aiScore: null, rawResponse: null });
    }
  };

  let className = classes.root;
  let body: React.ReactNode;
  let tooltip: React.ReactNode;

  if (loading) {
    className += " " + classes.loading;
    body = <><span className={classes.label}>Pangram</span>…</>;
    tooltip = "Running Pangram…";
  } else if (status === "scored" && typeof aiScore === "number") {
    className += " " + scoreClass(aiScore, classes);
    // Fallback branch below is for rows scored under the deprecated pre-v3 endpoint, which only returned a single aiScore.
    const hasFractions =
      fractionAi !== null || fractionAssisted !== null || fractionHuman !== null;
    body = hasFractions ? (
      <>
        <span className={classes.label}>Pangram</span>
        <span className={classes.aiFraction}>{pct(fractionAi)} AI</span>
        <span className={classes.fractionSep}>·</span>
        <span className={classes.assistedFraction}>{pct(fractionAssisted)} Asst</span>
        <span className={classes.fractionSep}>·</span>
        <span className={classes.humanFraction}>{pct(fractionHuman)} Human</span>
      </>
    ) : (
      <><span className={classes.label}>AI</span>{Math.round(aiScore * 100)}%</>
    );
    tooltip = (
      <div>
        {raw?.headline && <div className={classes.tooltipHeadline}>{raw.headline}</div>}
        {raw?.prediction && <div className={classes.tooltipPrediction}>{raw.prediction}</div>}
        {hasFractions && (
          <div className={classes.tooltipBreakdown}>
            AI {pct(fractionAi)} · AI-assisted {pct(fractionAssisted)} · Human {pct(fractionHuman)}
          </div>
        )}
        {raw?._truncated && (
          <div>
            <em>
              Scored on first {PANGRAM_MAX_CHARS_DISPLAY.toLocaleString()} chars
              {typeof raw._originalCharCount === "number" &&
                ` (truncated from ${raw._originalCharCount.toLocaleString()})`}
            </em>
          </div>
        )}
        {checkedAt && <div>Checked <FormatDate date={new Date(checkedAt)} /></div>}
        <div><em>Click to rerun</em></div>
      </div>
    );
  } else if (status === "too_short") {
    className += " " + classes.neutral;
    body = <><span className={classes.label}>Pangram</span>too short</>;
    tooltip = "Text is too short for reliable AI detection. Click to rerun.";
  } else if (status === "skipped_spam") {
    className += " " + classes.neutral;
    body = <><span className={classes.label}>Pangram</span>skipped (spam)</>;
    tooltip = "Skipped because the content was flagged as spam. Click to run anyway.";
  } else if (status === "error") {
    className += " " + classes.error;
    body = <><span className={classes.label}>Pangram</span>error — retry</>;
    tooltip = "Pangram call failed. Click to retry.";
  } else {
    className += " " + classes.loading;
    body = <><span className={classes.label}>Pangram</span>pending</>;
    tooltip = "Not yet checked. Click to run Pangram.";
  }

  return (
    <LWTooltip title={tooltip}>
      <span className={className} onClick={handleClick}>
        {body}
      </span>
    </LWTooltip>
  );
};

export default registerComponent("PangramBadge", PangramBadge, { styles });
