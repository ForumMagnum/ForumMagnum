"use client";

import React, { useMemo, useState } from "react";
import classNames from "classnames";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import ContentStyles from "@/components/common/ContentStyles";
import ErrorAccessDenied from "@/components/common/ErrorAccessDenied";
import { useCurrentUser } from "@/components/common/withUser";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { escapeHtml } from "@/lib/utils/sanitize";
import { scoreToColour } from "@/components/sunshineDashboard/helpers";

const styles = defineStyles("PangramPage", (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  header: {
    margin: 0,
  },
  intro: {
    color: theme.palette.grey[700],
    marginTop: 4,
  },
  textareaEl: {
    width: "100%",
    border: theme.palette.border.faint,
    padding: "8px 10px",
    fontSize: 14,
    background: theme.palette.background.paper,
    color: theme.palette.text.normal,
    outline: "none",
    fontFamily: theme.typography.fontFamily,
    minHeight: 240,
    resize: "vertical",
  },
  submitRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  button: {
    background: "none",
    border: "none",
    color: theme.palette.primary.main,
    padding: 0,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorMessage: {
    color: theme.palette.error.dark,
  },
  scoreLine: {
    color: theme.palette.text.normal,
  },
}));

const RUN_PANGRAM_ON_TEXT_MUTATION = gql(`
  mutation RunPangramOnText($text: String!) {
    runPangramOnText(text: $text) {
      pangramScore
      pangramMaxScore
      pangramPrediction
      pangramWindowScores {
        text
        score
        startIndex
        endIndex
      }
    }
  }
`);

interface PangramWindow {
  startIndex: number;
  endIndex: number;
  score: number;
}

/**
 * Build per-character score lookup for the submitted text. Later windows in the
 * list overwrite earlier overlapping ones (matching the existing
 * `highlightHtmlWithPangramWindowScores` semantics, where the last applied
 * background wins). Windows with score 0 are treated as "no highlight".
 */
function buildCharScores(textLength: number, windows: PangramWindow[]): (number | null)[] {
  const charScores: (number | null)[] = new Array(textLength).fill(null);
  for (const window of windows) {
    if (window.score <= 0) continue;
    const start = Math.max(0, window.startIndex);
    const end = Math.min(textLength, window.endIndex);
    for (let i = start; i < end; i++) {
      charScores[i] = window.score;
    }
  }
  return charScores;
}

/**
 * Find the [start, end) ranges of paragraphs in `text`. Paragraphs are
 * separated by blank lines (`\n` followed by optional whitespace then `\n`).
 */
function findParagraphRanges(text: string): { start: number, end: number }[] {
  const ranges: { start: number, end: number }[] = [];
  const paragraphSeparator = /\n\s*\n/g;
  let paragraphStart = 0;
  let match: RegExpExecArray | null;
  while ((match = paragraphSeparator.exec(text)) !== null) {
    ranges.push({ start: paragraphStart, end: match.index });
    paragraphStart = match.index + match[0].length;
  }
  ranges.push({ start: paragraphStart, end: text.length });
  return ranges;
}

/**
 * Render a `<span>` for a run of consecutive characters with the same score
 * (or no highlight if score is null). Escapes HTML so plain-text input can't
 * inject markup.
 */
function renderRun(text: string, runStart: number, runEnd: number, runScore: number | null): string {
  if (runEnd <= runStart) return "";
  const html = escapeHtml(text.slice(runStart, runEnd));
  if (runScore === null) return html;
  return `<span style="background-color:${scoreToColour(runScore)}" title="Score: ${runScore.toFixed(2)}">${html}</span>`;
}

/**
 * Render a single paragraph: walks `[start, end)` and emits spans of
 * consecutive same-score runs, with single newlines becoming `<br/>`.
 */
function renderParagraph(text: string, start: number, end: number, charScores: (number | null)[]): string {
  if (start >= end) return "<p></p>";
  const parts: string[] = ["<p>"];
  let runStart = start;
  let runScore: number | null = charScores[start] ?? null;
  for (let i = start; i < end; i++) {
    if (text[i] === "\n") {
      parts.push(renderRun(text, runStart, i, runScore));
      parts.push("<br/>");
      runStart = i + 1;
      runScore = i + 1 < end ? charScores[i + 1] ?? null : null;
      continue;
    }
    const ithScore = charScores[i] ?? null;
    if (ithScore !== runScore) {
      parts.push(renderRun(text, runStart, i, runScore));
      runStart = i;
      runScore = ithScore;
    }
  }
  parts.push(renderRun(text, runStart, end, runScore));
  parts.push("</p>");
  return parts.join("");
}

/**
 * Build highlighted HTML for the exact text we sent to Pangram, using the
 * window `startIndex`/`endIndex` directly. This avoids the fuzzy word-based
 * matching that `highlightHtmlWithPangramWindowScores` has to do for posts
 * (where the markdown sent to Pangram doesn't line up cleanly with the
 * stored HTML).
 */
function buildHighlightedHtmlFromIndices(text: string, windows: PangramWindow[]): string {
  if (!text) return "";
  const charScores = buildCharScores(text.length, windows);
  const paragraphRanges = findParagraphRanges(text);
  return paragraphRanges
    .map(({ start, end }) => renderParagraph(text, start, end, charScores))
    .join("");
}

const PangramPage = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [text, setText] = useState("");
  const [submittedText, setSubmittedText] = useState<string | null>(null);

  const [runPangram, { data, loading, error, reset }] = useMutation(RUN_PANGRAM_ON_TEXT_MUTATION);

  const result = data?.runPangramOnText ?? null;

  const highlightedHtml = useMemo(() => {
    if (!result || submittedText === null) return "";
    return buildHighlightedHtmlFromIndices(submittedText, result.pangramWindowScores ?? []);
  }, [result, submittedText]);

  if (!userIsAdminOrMod(currentUser)) {
    return <ErrorAccessDenied />;
  }

  const trimmed = text.trim();
  const canSubmit = !!trimmed && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    reset();
    setSubmittedText(trimmed);
    await runPangram({ variables: { text: trimmed } });
  };

  return <SingleColumnSection>
    <div className={classes.root}>
      <div>
        <h2 className={classes.header}>Pangram</h2>
        <div className={classes.intro}>
          Paste text below to run it through Pangram's AI-detection API. Results show the
          average and max AI likelihood, the overall prediction, and the input text with
          per-window scores highlighted.
        </div>
      </div>

      <textarea
        className={classes.textareaEl}
        rows={12}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text to evaluate..."
      />

      <div className={classes.submitRow}>
        <button
          type="button"
          className={classNames(classes.button, !canSubmit && classes.buttonDisabled)}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {loading ? "Submitting..." : "Submit to Pangram"}
        </button>
      </div>

      {error ? <div className={classes.errorMessage}>{error.message}</div> : null}

      {result ? <>
        <div className={classes.scoreLine}>
          Pangram score average: <strong>{result.pangramScore.toFixed(2)}</strong>
          {result.pangramMaxScore !== null && result.pangramMaxScore !== undefined
            ? <>, max: <strong>{result.pangramMaxScore.toFixed(2)}</strong></>
            : null}
          {result.pangramPrediction
            ? <>, prediction: <strong>{result.pangramPrediction}</strong></>
            : null}
        </div>
        <ContentStyles contentType="comment">
          <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        </ContentStyles>
      </> : null}
    </div>
  </SingleColumnSection>;
};

export default PangramPage;
