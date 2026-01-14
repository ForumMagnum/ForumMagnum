"use client";
import React, { useRef } from 'react';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from '@/lib/generated/gql-codegen';
import { Link } from '@/lib/reactRouterWrapper';
import { useParams } from 'next/navigation';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { siteUrlSetting } from '@/lib/instanceSettings';
import groupBy from 'lodash/groupBy';

const REVIEW_TOP_POSTS_WITH_REVIEWS_QUERY = gql(`
  query ReviewTopPostsWithReviewsQuery($reviewYear: Int!, $limit: Int) {
    ReviewTopPostsWithReviews(reviewYear: $reviewYear, limit: $limit) {
      posts {
        _id
        slug
        title
        user {
          _id
          displayName
          slug
        }
      }
      reviews {
        _id
        postId
        baseScore
        user {
          _id
          displayName
          slug
        }
      }
    }
  }
`);

const styles = defineStyles('ReviewTopPostsList', (theme: ThemeType) => ({
  root: {
    maxWidth: 900,
    margin: '0 auto',
    padding: 16,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  copyButton: {
    padding: '4px 8px',
    fontSize: 13,
    cursor: 'pointer',
    background: theme.palette.grey[200],
    border: 'none',
    '&:hover': {
      background: theme.palette.grey[300],
    },
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '8px',
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
    fontWeight: 600,
  },
  td: {
    padding: '8px',
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
  },
  author: {
    color: theme.palette.grey[600],
  },
  reviewers: {
    color: theme.palette.grey[500],
    fontSize: 13,
  },
}));

type UserInfo = { _id: string; displayName: string; slug: string };
type ReviewInfo = { _id: string; postId: string | null; user?: UserInfo | null; baseScore: number };
type PostResult = { _id: string; slug: string; title: string; user?: UserInfo | null };
type ReviewerWithReview = { user: UserInfo; reviewId: string; baseScore: number };

function getUniqueReviewers(reviews: ReviewInfo[]): ReviewerWithReview[] {
  const seen = new Set<string>();
  const result: ReviewerWithReview[] = [];
  for (const r of reviews) {
    if (r.user && !seen.has(r.user._id)) {
      seen.add(r.user._id);
      result.push({ user: r.user, reviewId: r._id, baseScore: r.baseScore ?? 0 });
    }
  }
  return result;
}

type PostWithReviewers = PostResult & { reviewers: ReviewerWithReview[] };

const ReviewTopPostsList = () => {
  const classes = useStyles(styles);
  const params = useParams();
  const yearParam = params?.year;
  const year = typeof yearParam === 'string' ? parseInt(yearParam, 10) : null;
  const tableRef = useRef<HTMLTableElement>(null);

  const { data, loading, error } = useQuery(REVIEW_TOP_POSTS_WITH_REVIEWS_QUERY, {
    variables: { reviewYear: year!, limit: 50 },
    skip: !year || isNaN(year),
  });

  const rawPosts = data?.ReviewTopPostsWithReviews?.posts ?? [];
  const rawReviews = data?.ReviewTopPostsWithReviews?.reviews ?? [];
  const reviewsByPostId = groupBy(rawReviews, r => r.postId);
  const posts: PostWithReviewers[] = rawPosts.map(post => ({
    ...post,
    reviewers: getUniqueReviewers(reviewsByPostId[post._id] ?? []),
  }));
  const siteUrl = 'https://www.lesswrong.com';

  const copyAsHtmlTable = () => {
    if (!tableRef.current) return;
    // Get the table HTML and convert relative URLs to absolute
    const html = tableRef.current.outerHTML.replace(/href="\//g, `href="${siteUrl}/`);
    const blob = new Blob([html], { type: 'text/html' });
    void navigator.clipboard.write([new ClipboardItem({ 'text/html': blob, 'text/plain': new Blob([html], { type: 'text/plain' }) })]);
  };

  if (!year || isNaN(year)) {
    return <div className={classes.root}>Invalid year</div>;
  }

  if (loading) {
    return <div className={classes.root}>Loading...</div>;
  }

  if (error) {
    return <div className={classes.root}>Error loading posts</div>;
  }

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <h1 style={{ margin: 0 }}>{year} Review Top Nominations</h1>
        <button className={classes.copyButton} onClick={copyAsHtmlTable}>Copy as HTML table</button>
      </div>
      <table ref={tableRef} className={classes.table}>
        <thead>
          <tr>
            <th className={classes.th}>#</th>
            <th className={classes.th}>Title</th>
            <th className={classes.th}>Reviewers</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post, idx) => (
            <tr key={post._id}>
              <td className={classes.td}>
                <code>{idx + 1}</code>
              </td>
              <td className={classes.td}>
                <Link to={`/posts/${post._id}/${post.slug}`}>
                  {post.title}
                </Link><br/><span className={classes.author}>{post.user?.displayName}</span>
              </td>
              <td className={classes.td}>
                {post.reviewers.length > 0 ? (
                  <span className={classes.reviewers}>
                    {post.reviewers.map((r, i) => (
                      <>
                      <Link to={`/posts/${post._id}/${post.slug}?commentId=${r.reviewId}`} key={r.user._id}>{r.user.displayName}</Link>
                       { i < post.reviewers.length - 1 && <br/> }
                      </>
                    ))}
                  </span>
                ) : null}
                {post.reviewers.length === 0 && <span className={classes.reviewers}>
                  <strong>NO REVIEWS</strong></span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReviewTopPostsList;
