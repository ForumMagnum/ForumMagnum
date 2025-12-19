import React, { useState, useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { ContentItemBody } from "../../contents/ContentItemBody";
import ContentStyles from "../../common/ContentStyles";

const styles = defineStyles('RejectionNotice', (theme: ThemeType) => ({
  root: {
    ...theme.typography.contentNotice,
    ...theme.typography.commentStyle,
    padding: 12,
    paddingBottom: 4,
    paddingRight: 24,
    maxWidth: 600,
    marginBottom: 30,
    backgroundColor: theme.palette.grey[100],
    cursor: 'pointer',
  },
  headerText: {
    fontSize: 14,
    color: theme.palette.grey[900],
  },
  summaryContent: {
    '& li': {
      ...theme.typography.commentStyle,
      ...theme.typography.body2,
      marginBottom: 0,
    },
  },
  expandedReason: {
    '& ul, & ol': { paddingLeft: 20 },
    '& li': { marginBottom: 16 },
  },
  collapseButton: {
    marginTop: -8,
    fontSize: 12,
    color: theme.palette.primary.main,
    cursor: 'pointer',
    textAlign: 'center',
  },
}));

function extractLeadingText(html: string): string {
  const trimmed = html.trim();
  const boldMatch = trimmed.match(/^<(strong|b)>([\s\S]*?)<\/\1>/i);
  if (boldMatch) return boldMatch[2].replace(/<[^>]*>/g, '').trim();
  const plainText = trimmed.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentenceMatch = plainText.match(/^[^.!?]*[.!?]/);
  return sentenceMatch ? sentenceMatch[0].trim() : plainText;
}

function htmlWordCount(html: string): number {
  return html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/g).filter(Boolean).length;
}

function extractSummary(html: string): string[] {
  const trimmedHtml = html.trim().replace(/^<p>\s*<\/p>/gi, '');
  if (/^<[ou]l/i.test(trimmedHtml)) {
    return (trimmedHtml.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [])
      .map(li => extractLeadingText(li.replace(/<\/?li[^>]*>/gi, '')))
      .filter(Boolean);
  }
  const firstParagraph = trimmedHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const leading = extractLeadingText(firstParagraph ? firstParagraph[1] : trimmedHtml);
  return leading ? [leading] : [];
}

const RejectionNotice = ({rejectedReason}: {rejectedReason?: string | null}) => {
  const classes = useStyles(styles);
  const [expanded, setExpanded] = useState(false);
  const summarySentences = useMemo(() => rejectedReason ? extractSummary(rejectedReason) : [], [rejectedReason]);

  if (!rejectedReason || (!expanded && !summarySentences.length)) return null;

  return (
    <div className={classes.root} onClick={() => setExpanded(true)}>
      <p className={classes.headerText}>Rejected for the following reason(s):</p>
      {!expanded && (
        summarySentences.length > 1 ? (
          <ul className={classes.summaryContent}>
            {summarySentences.map((sentence, i) => <li key={i}><strong>{sentence}</strong></li>)}
          </ul>
        ) : (
          <div className={classes.summaryContent}><strong>{summarySentences[0]}</strong></div>
        )
      )}
      {expanded && (
        <ContentStyles contentType="comment" className={classes.expandedReason}>
          <ContentItemBody dangerouslySetInnerHTML={{__html: rejectedReason}}/>
        </ContentStyles>
      )}
      <div className={classes.collapseButton} onClick={(e) => {e.stopPropagation(); setExpanded(!expanded)}}>{expanded ? 'Collapse' : `Read full explanation`}</div>
    </div>
  );
}

export default RejectionNotice;
