'use client';

import React, { type JSX } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { Link } from '@/lib/reactRouterWrapper';
import HoverPreviewLink from '../linkPreview/HoverPreviewLink';

export interface ReviewResultsEntry {
  rank: number;
  title: string;
  postUrl: string;
  authorName: string;
  coauthorNames?: string[];
  votes: number[];
}

const styles = defineStyles('ReviewResultsTableDisplay', (theme: ThemeType) => ({
  root: {
    padding: '8px 0',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    tableLayout: 'fixed',
    borderCollapse: 'collapse',
    border: 'none !important',
  },
  row: {
    borderBottom: theme.palette.greyBorder('1px', 0.2),
  },
  rankCell: {
    width: 40,
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
    border: 'none !important',
    padding: '4px 8px',
    verticalAlign: 'middle',
  },
  postTitle: {
    fontWeight: 500,
    color: theme.palette.greyAlpha(0.87),
    lineHeight: '2rem',
    marginRight: 4,
    '&:hover': {
      color: theme.palette.greyAlpha(0.87),
    },
  },
  titleCellInner: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: theme.palette.greyAlpha(0.5),
  },
  postAuthor: {
    fontSize: 14,
    whiteSpace: 'nowrap',
    lineHeight: '1rem',
    color: theme.palette.greyAlpha(0.5),
  },
  dotsCell: {
    width: '50%',
    border: 'none !important',
    padding: '4px 8px',
    verticalAlign: 'middle',
    [theme.breakpoints.down('sm')]: {
      width: '35%',
    },
  },
  dotsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    paddingTop: 8,
    paddingBottom: 8,
    flexWrap: 'wrap',
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
  results: ReviewResultsEntry[];
  context: 'editor' | 'content-item-body';
}

export function ReviewResultsTableDisplay({
  results,
  context,
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
                <div className={classes.titleCellInner}>
                  {context === 'editor' ? (
                    <Link to={entry.postUrl} className={classes.postTitle}>{entry.title}</Link>
                  ) : (
                    <HoverPreviewLink href={entry.postUrl} id={entry.rank.toString()} className={classes.postTitle}>
                      {entry.title}
                    </HoverPreviewLink>
                  )}
                  <span className={classes.postAuthor}>
                    {entry.coauthorNames && entry.coauthorNames.length > 0
                      ? `${entry.authorName}, ${entry.coauthorNames.join(', ')}`
                      : entry.authorName}
                  </span>
                </div>
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
