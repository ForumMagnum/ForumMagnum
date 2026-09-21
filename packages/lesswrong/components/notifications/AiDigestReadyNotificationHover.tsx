'use client';

import React from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { truncateAiDigestText } from '@/lib/aiDigest/aiDigestDisplay';

/** Roughly the first paragraph or two of the note. */
const AI_NOTE_PREVIEW_MAX_CHARS = 600;

const styles = defineStyles('AiDigestReadyNotificationHover', (theme: ThemeType) => ({
  root: {
    padding: 16,
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    maxWidth: 480,
  },
  subject: {
    fontWeight: 600,
    marginBottom: 8,
  },
  paragraph: {
    margin: 0,
    '& + &': {
      marginTop: 8,
    },
  },
}));

function aiNoteParagraphs(extraData: NotificationsList["extraData"]): string[] {
  const paragraphs: unknown = extraData?.aiNote;
  return Array.isArray(paragraphs)
    ? paragraphs.filter((paragraph): paragraph is string => typeof paragraph === "string")
    : [];
}

/** The leading paragraphs of the note, cut to a character budget at a word boundary. */
function previewParagraphs(paragraphs: string[], maxChars: number): string[] {
  const preview: string[] = [];
  let remaining = maxChars;
  for (const paragraph of paragraphs) {
    if (remaining <= 0) {
      break;
    }
    const shown = truncateAiDigestText(paragraph, remaining);
    preview.push(shown);
    remaining -= shown.length;
  }
  return preview;
}

const AiDigestReadyNotificationHover = ({notification}: {
  notification: NotificationsList,
}) => {
  const classes = useStyles(styles);
  const subject: unknown = notification.extraData?.subject;
  const paragraphs = previewParagraphs(aiNoteParagraphs(notification.extraData), AI_NOTE_PREVIEW_MAX_CHARS);
  return <div className={classes.root}>
    <div className={classes.subject}>
      {typeof subject === "string" && subject ? subject : "Your tailored recommendations are ready"}
    </div>
    {paragraphs.map((paragraph, index) => (
      <p key={index} className={classes.paragraph}>{paragraph}</p>
    ))}
  </div>;
};

export default AiDigestReadyNotificationHover;
