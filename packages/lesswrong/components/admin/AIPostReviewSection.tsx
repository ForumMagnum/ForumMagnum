"use client";
import React from 'react';
import { Link } from '@/lib/reactRouterWrapper';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import UserReviewButton from './UserReviewButton';
import Loading from '../vulcan-core/Loading';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { aiPostReviewPostsQueryQuery } from '@/lib/generated/gql-codegen/graphql';

type AIPostReviewPost = NonNullable<aiPostReviewPostsQueryQuery['posts']>['results'][number];

function scoreColor(score: number, low: number, high: number): string {
  if (score <= low) return '#c62828';
  if (score >= high) return '#2e7d32';
  const ratio = (score - low) / (high - low);
  if (ratio < 0.5) return '#e65100';
  return '#558b2f';
}

function karmaColor(score: number): string {
  if (score < 0) return '#c62828';
  if (score < 5) return '#777';
  if (score < 25) return '#558b2f';
  return '#2e7d32';
}

const styles = defineStyles('AIPostReviewSection', (theme: ThemeType) => ({
  section: {
    marginBottom: 24,
    ...theme.typography.body2,
  },
  sectionTitle: {
    ...theme.typography.h3,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  },
  headerRow: {
    borderBottom: theme.palette.greyBorder('2px', 0.15),
  },
  th: {
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    color: theme.palette.grey[500],
    padding: '4px 6px',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  thRight: {
    textAlign: 'right',
    fontSize: 11,
    fontWeight: 600,
    color: theme.palette.grey[500],
    padding: '4px 6px',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  row: {
    borderBottom: theme.palette.greyBorder('1px', 0.1),
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.03),
    },
  },
  titleCell: {
    maxWidth: 350,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '3px 6px',
    fontSize: 18
  },
  titleLink: {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': { textDecoration: 'underline' },
  },
  author: {
    color: theme.palette.grey[600],
    whiteSpace: 'nowrap',
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    padding: '3px 6px',
  },
  scoreCell: {
    textAlign: 'right',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    padding: '3px 6px',
  },
  choiceCell: {
    fontSize: 11,
    whiteSpace: 'nowrap',
    padding: '3px 6px',
  },
  reviewCell: {
    whiteSpace: 'nowrap',
    padding: '3px 4px',
  },
  rejected: {
    fontSize: 11,
    color: theme.palette.error.main,
    fontWeight: 600,
  },
  noScore: {
    color: theme.palette.grey[400],
  },
  empty: {
    fontSize: 12,
    color: theme.palette.grey[500],
    padding: '8px 6px',
  },
}));

const AIPostReviewSection = ({title, posts, loading}: {title: string, posts: AIPostReviewPost[], loading: boolean}) => {
  const classes = useStyles(styles);
  if (loading) return <div className={classes.section}><div className={classes.sectionTitle}>{title}</div><Loading /></div>;
  return <div className={classes.section}>
    <div className={classes.sectionTitle}>{title}</div>
    <table className={classes.table}>
      <thead>
        <tr className={classes.headerRow}>
          <th className={classes.th}>Title</th>
          <th className={classes.th}>Author</th>
          <th className={classes.thRight}>Karma</th>
          <th className={classes.thRight}>Pangram</th>
          <th className={classes.thRight}>Custom</th>
          <th className={classes.th}>AI Choice</th>
          <th className={classes.th}>Reviews</th>
        </tr>
      </thead>
      <tbody>
        {posts.map(post => {
          const evals = post.automatedContentEvaluations;
          const pangram = evals?.pangramScore;
          const pangramMax = evals?.pangramMaxScore;
          const customScore = evals?.score;
          const aiChoice = evals?.aiChoice;
          return <tr key={post._id} className={classes.row}>
            <td className={classes.titleCell}>
              <Link to={postGetPageUrl(post)} className={classes.titleLink}>{post.title}</Link>
              {post.rejected && <> <span className={classes.rejected}>REJ</span></>}
            </td>
            <td className={classes.author}>{post.user?.displayName}</td>
            <td className={classes.scoreCell} style={{ color: karmaColor(post.baseScore) }}>
              {post.baseScore}
            </td>
            <td className={classes.scoreCell}>
              {typeof pangram === 'number'
                ? <span style={{ color: scoreColor(pangram, 0, 1) }} title={`Max: ${pangramMax?.toFixed(2) ?? '?'}`}>{pangram.toFixed(2)}</span>
                : <span className={classes.noScore}>—</span>}
            </td>
            <td className={classes.scoreCell}>
              {typeof customScore === 'number'
                ? <span style={{ color: scoreColor(customScore, 1, 5) }}>{customScore.toFixed(1)}</span>
                : <span className={classes.noScore}>—</span>}
            </td>
            <td className={classes.choiceCell}>
              {aiChoice ?? <span className={classes.noScore}>—</span>}
            </td>
            <td className={classes.reviewCell}>
              <UserReviewButton postId={post._id} reviewerName="John Wentworth" />
              {' '}
              <UserReviewButton postId={post._id} reviewerName="Neel Nanda" />
            </td>
          </tr>;
        })}
      </tbody>
    </table>
    {posts.length === 0 && <div className={classes.empty}>No posts found</div>}
  </div>;
};

export default AIPostReviewSection;
