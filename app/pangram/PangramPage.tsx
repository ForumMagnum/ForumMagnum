"use client";

import React, { useMemo, useState } from "react";
import classNames from "classnames";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import ContentStyles from "@/components/common/ContentStyles";
import { useCurrentUser } from "@/components/common/withUser";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { escapeHtml } from "@/lib/utils/sanitize";
import { highlightHtmlWithPangramWindowScores } from "@/components/sunshineDashboard/helpers";

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
    cursor: "not-allowed",
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

/**
 * Convert plain text input into simple HTML, splitting on blank lines into
 * paragraphs and converting single newlines into `<br/>` so that the rendered
 * comment-styled output preserves line breaks. Escapes HTML entities first to
 * avoid letting users inject markup.
 */
function plainTextToHtml(text: string): string {
  const escaped = escapeHtml(text);
  const paragraphs = escaped.split(/\n\s*\n/);
  return paragraphs
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

const PangramPage = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [text, setText] = useState("");

  const [runPangram, { data, loading, error, reset }] = useMutation(RUN_PANGRAM_ON_TEXT_MUTATION);

  const result = data?.runPangramOnText ?? null;

  const highlightedHtml = useMemo(() => {
    if (!result) return "";
    return highlightHtmlWithPangramWindowScores(
      plainTextToHtml(text),
      result.pangramWindowScores ?? [],
    );
  }, [result, text]);

  if (!userIsAdminOrMod(currentUser)) {
    return <SingleColumnSection>
      <p>You must be logged in as an admin or moderator to use this page.</p>
    </SingleColumnSection>;
  }

  const trimmed = text.trim();
  const canSubmit = !!trimmed && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    reset();
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
