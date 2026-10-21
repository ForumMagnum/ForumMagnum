import React from "react";
import { makeCloudinaryImageUrl } from "../common/cloudinaryHelpers";
import ImageUpload2 from "../form-components/ImageUpload2";
import SequencesGridItem, { DEFAULT_SEQUENCE_CARD_IMAGE_ID } from "../sequences/SequencesGridItem";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { useSequenceEditor } from "./SequenceEditorContext";

const DEFAULT_CARD_IMAGE_URL = makeCloudinaryImageUrl(DEFAULT_SEQUENCE_CARD_IMAGE_ID, { c: "fill", dpr: "auto", q: "auto", f: "auto" });

/** The bottom margin leaves room for the fixed bottom bar. */
const styles = defineStyles("SequencePreviewPanel", (theme: ThemeType) => ({
  root: {
    marginTop: 48,
    paddingTop: 24,
    borderTop: theme.palette.greyBorder("1px", 0.1),
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
  card: {
    width: 315,
    maxWidth: "100%",
  },
}));

/**
 * Shown at the bottom of the sequence page in edit mode: the sequence's
 * Library card (SequencesGridItem), where the author sets its card image.
 * This follows the post editor's Social Preview card. With no card image, it
 * shows the card's default image, as the Library does.
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
      <SequencesGridItem
        sequence={sequence}
        showAuthor
        linked={false}
        image={<ImageUpload2
          name="gridImageId"
          value={sequence.gridImageId}
          updateValue={(gridImageId: string) => updateSequence({ gridImageId })}
          clearField={() => updateSequence({ gridImageId: null })}
          label="Add card image"
          placeholderUrl={DEFAULT_CARD_IMAGE_URL}
          fillContainer
        />}
      />
    </div>
  </section>;
};

export default SequencePreviewPanel;
