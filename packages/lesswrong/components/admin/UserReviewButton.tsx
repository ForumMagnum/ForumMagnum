"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { useDialog } from '../common/withDialog';
import UserReviewDialog from './UserReviewDialog';
import Loading from '../vulcan-core/Loading';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const aiUserReviewMutation = gql(`
  mutation aiUserReviewMutation($postId: String!, $reviewerName: String!) {
    aiUserReview(postId: $postId, reviewerName: $reviewerName)
  }
`);

function getStorageKey(reviewerName: string, postId: string): string {
  return `aiReview-${reviewerName}-${postId}`;
}

function loadReviews(reviewerName: string, postId: string): string[] {
  const raw = localStorage.getItem(getStorageKey(reviewerName, postId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [parsed];
  } catch {
    return [raw];
  }
}

function saveReviews(reviewerName: string, postId: string, reviews: string[]) {
  localStorage.setItem(getStorageKey(reviewerName, postId), JSON.stringify(reviews));
}

function extractVerdict(reviewText: string): string | null {
  const lastLine = reviewText.trim().split('\n').pop()?.trim();
  if (!lastLine) return null;
  const verdicts = ['Definitely Reject', 'Probably Reject', 'Lean Reject', 'Lean Approve', 'Probably Approve', 'Definitely Approve'];
  return verdicts.find(v => lastLine === v) ?? lastLine;
}

const styles = defineStyles('UserReviewButton', (theme: ThemeType) => ({
  button: {
    cursor: 'pointer',
    fontSize: 12,
    padding: '2px 8px',
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[700],
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
    },
  },
  loading: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    fontSize: 12,
    backgroundColor: theme.palette.grey[200],
  },
}));

const UserReviewButton = ({postId, reviewerName}: {postId: string, reviewerName: string}) => {
  const classes = useStyles(styles);
  const { openDialog } = useDialog();
  const [reviews, setReviews] = useState<string[]>([]);
  const [runReview, { loading }] = useMutation(aiUserReviewMutation);

  useEffect(() => {
    setReviews(loadReviews(reviewerName, postId));
  }, [reviewerName, postId]);

  const runNewReview = useCallback(async () => {
    const { data } = await runReview({ variables: { postId, reviewerName } });
    const result = data?.aiUserReview;
    if (result) {
      const updated = [...loadReviews(reviewerName, postId), result];
      saveReviews(reviewerName, postId, updated);
      setReviews(updated);
    }
  }, [postId, reviewerName, runReview]);

  const handleClick = useCallback(async () => {
    if (reviews.length > 0) {
      openDialog({
        name: 'UserReviewDialog',
        contents: ({ onClose }) => (
          <UserReviewDialog
            onClose={onClose}
            reviewerName={reviewerName}
            reviews={reviews}
            onRunAgain={async () => {
              await runNewReview();
              onClose();
            }}
            loading={loading}
          />
        ),
      });
      return;
    }
    await runNewReview();
  }, [reviews, reviewerName, runNewReview, loading, openDialog]);

  if (loading && reviews.length === 0) {
    return <span className={classes.loading}><Loading /></span>;
  }

  const verdicts = reviews.map(r => extractVerdict(r)).filter(Boolean);
  const verdictsLabel = verdicts.length > 0 ? verdicts.join(', ') : '';
  const label = verdictsLabel
    ? `${reviewerName}: ${verdictsLabel}`
    : `${reviewerName} Review`;

  return <span className={classes.button} onClick={handleClick}>{label}</span>;
};

export default UserReviewButton;
