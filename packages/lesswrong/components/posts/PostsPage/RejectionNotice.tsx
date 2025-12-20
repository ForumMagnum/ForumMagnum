import React, { useState, useMemo } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { ContentItemBody } from "../../contents/ContentItemBody";
import ContentStyles from "../../common/ContentStyles";
import { parseDocumentFromString } from '@/lib/domParser';

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
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
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

// Extracts a summary from HTML rejection reasons:
// - For lists (<ul>/<ol>): extracts text from each <li> item
// - For paragraphs: extracts the first <p> content
// - Text extraction includes multiple sentences if they are all bold, or just the first sentence if they are not. (Since we often use bold to convey multi-sentence-summaries)

function extractLeadingText(element: Element): string {
  const firstChild = element.firstElementChild;
  if (firstChild && (firstChild.tagName === 'STRONG' || firstChild.tagName === 'B')) {
    return (firstChild.textContent ?? '').trim();
  }
  const plainText = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
  return plainText.match(/^[^.!?]*[.!?]/)?.[0]?.trim() ?? plainText;
}

function extractSummary(html: string): string[] {
  const { document } = parseDocumentFromString(html);
  const body = document.body;
  const firstSignificantElement = Array.from(body.children).find(
    child => child.tagName !== 'P' || (child.textContent ?? '').trim()
  );
  if (!firstSignificantElement) return [];
  if (firstSignificantElement.tagName === 'UL' || firstSignificantElement.tagName === 'OL') {
    return Array.from(firstSignificantElement.querySelectorAll('li')).map(li => extractLeadingText(li)).filter(Boolean);
  }
  const target = firstSignificantElement.tagName === 'P' ? firstSignificantElement : body;
  const leading = extractLeadingText(target);
  return leading ? [leading] : [];
}

const RejectionNotice = ({rejectedReason}: {rejectedReason?: string | null}) => {
  const classes = useStyles(styles);
  const [expanded, setExpanded] = useState(false);
  const summarySentences = useMemo(() => rejectedReason ? extractSummary(rejectedReason) : [], [rejectedReason]);

  if (!rejectedReason) return <div className={classes.root}>This post was rejected.</div>;
    
  if (!expanded && !summarySentences.length) return null;

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
