import React from "react";
import { makeCloudinaryImageUrl } from "../common/cloudinaryHelpers";
import ImageUpload2 from "../form-components/ImageUpload2";
import UsersName from "../users/UsersName";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useSequenceEditor } from "./SequenceEditorContext";

// What the Library card shows when a sequence has no card image
// (SequencesGridItem uses the same fallback).
const DEFAULT_CARD_IMAGE_ID = "sequences/vnyzzznenju0hzdv6pqb.jpg";

const styles = defineStyles("SequencePreviewPanel", (theme: ThemeType) => ({
  root: {
    marginTop: 48,
    paddingTop: 24,
    borderTop: theme.palette.greyBorder("1px", 0.1),
    // Leave room for the fixed bottom bar
    marginBottom: 96,
  },
  heading: {
    ...theme.typography.commentStyle,
    fontSize: 15,
    fontWeight: 600,
    color: theme.palette.greyAlpha(0.8),
  },
  hint: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    color: theme.palette.greyAlpha(0.55),
    marginTop: 4,
    marginBottom: 16,
    maxWidth: 520,
  },
  // Mirrors SequencesGridItem, the card in the Library grid.
  card: {
    width: 315,
    maxWidth: "100%",
    boxShadow: theme.palette.boxShadow.default,
    background: theme.palette.panelBackground.default,
    "& img": {
      marginBottom: 0,
    },
  },
  meta: {
    padding: "10px 8px 8px 12px",
  },
  title: {
    fontSize: 16,
    lineHeight: 1.0,
    paddingTop: 2,
    ...theme.typography.smallCaps,
    color: theme.palette.text.normal,
  },
  draft: {
    textTransform: "uppercase",
    color: theme.palette.text.sequenceIsDraft,
  },
  author: {
    ...theme.typography.body2,
    fontSize: 14,
    marginTop: 4,
    color: theme.palette.text.dim,
  },
}));

/**
 * Shown at the bottom of the sequence page in edit mode: a preview of the
 * sequence's card as it appears elsewhere on the site, where the author sets
 * its card image. This follows the post editor's Social Preview card.
 */
const SequencePreviewPanel = () => {
  const classes = useStyles(styles);
  const { sequence, updateSequence } = useSequenceEditor();

  return <section className={classes.root}>
    <div className={classes.heading}>How this sequence appears elsewhere</div>
    <div className={classes.hint}>
      This card is shown in the Library, on your profile, and in "continue reading" on posts.
      Its image is also used when the sequence is shared on social media.
    </div>
    <div className={classes.card}>
      <ImageUpload2
        name="gridImageId"
        value={sequence.gridImageId}
        updateValue={(gridImageId: string) => updateSequence({ gridImageId })}
        clearField={() => updateSequence({ gridImageId: null })}
        label="Add card image"
        placeholderUrl={makeCloudinaryImageUrl(DEFAULT_CARD_IMAGE_ID, { c: "fill", dpr: "auto", q: "auto", f: "auto" })}
      />
      <div className={classes.meta}>
        <div className={classes.title}>
          {sequence.draft && <span className={classes.draft}>[Draft] </span>}
          {sequence.title}
        </div>
        {sequence.user && <div className={classes.author}>by <UsersName user={sequence.user} /></div>}
      </div>
    </div>
  </section>;
};

export default SequencePreviewPanel;
