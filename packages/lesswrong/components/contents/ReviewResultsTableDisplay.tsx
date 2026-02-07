'use client';

import React, { type JSX } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface ReviewResultsEntry {
  rank: number;
  title: string;
  postUrl: string;
  authorName: string;
  votes: number[];
}

const styles = defineStyles('ReviewResultsTableDisplay', (theme: ThemeType) => ({
  root: {
    padding: '8px 0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    border: 'none !important',
  },
  row: {
    borderBottom: theme.palette.greyBorder('1px', 0.2),
  },
  rankCell: {
    whiteSpace: 'pre',
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'sans-serif',
    color: theme.palette.grey[500],
    border: 'none !important',
    padding: '4px 8px',
    verticalAlign: 'middle',
  },
  titleCell: {
    maxWidth: 350,
    border: 'none !important',
    padding: '4px 8px',
    verticalAlign: 'middle',
  },
  postTitle: {
    fontWeight: 500,
    color: theme.palette.greyAlpha(0.87),
    lineHeight: '2rem',
    '&:hover': {
      color: theme.palette.greyAlpha(0.87),
    },
  },
  postAuthor: {
    fontSize: 14,
    whiteSpace: 'pre',
    lineHeight: '1rem',
    wordBreak: 'keep-all',
    color: theme.palette.greyAlpha(0.5),
    marginLeft: 4,
  },
  dotsCell: {
    border: 'none !important',
    padding: '4px 8px',
    verticalAlign: 'middle',
  },
  dotsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    paddingTop: 8,
    paddingBottom: 8,
    flexWrap: 'wrap',
    width: 350,
  },
  dot: {
    marginRight: 2,
    marginBottom: 2,
    borderRadius: '50%',
    display: 'inline-block',
  },
}));

function getDotStyle(vote: number): React.CSSProperties {
  const size = Math.max(Math.abs(vote) * 1.5, 3);
  const color = vote > 0 ? '#5f9b65' : '#bf360c';
  return { width: size, height: size, background: color };
}

interface ReviewResultsTableDisplayProps {
  year: number;
  results: ReviewResultsEntry[];
}

export function ReviewResultsTableDisplay({
  year,
  results,
}: ReviewResultsTableDisplayProps): JSX.Element {
  const classes = useStyles(styles);
  return (
    <div className={classes.root}>
      <table className={classes.table}>
        <tbody>
          {results.map((entry) => (
            <tr key={entry.rank} className={classes.row}>
              <td className={classes.rankCell}>{entry.rank + 1}</td>
              <td className={classes.titleCell}>
                <a href={entry.postUrl} className={classes.postTitle}>{entry.title}</a>
                <span className={classes.postAuthor}>{entry.authorName}</span>
              </td>
              <td className={classes.dotsCell}>
                <div className={classes.dotsRow}>
                  {entry.votes.map((vote, i) => (
                    <span
                      key={i}
                      className={classes.dot}
                      title={String(vote)}
                      style={getDotStyle(vote)}
                    />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
