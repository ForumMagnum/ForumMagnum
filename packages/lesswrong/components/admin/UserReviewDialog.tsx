"use client";
import React from 'react';
import LWDialog from '@/components/common/LWDialog';
import { DialogContent } from '@/components/widgets/DialogContent';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Loading from '../vulcan-core/Loading';

const styles = defineStyles('UserReviewDialog', (theme: ThemeType) => ({
  reviewBlock: {
    whiteSpace: 'pre-wrap',
    fontSize: 14,
    lineHeight: 1.6,
    padding: '12px 0',
    '& + &': {
      borderTop: theme.palette.greyBorder('1px', 0.15),
    },
  },
  reviewLabel: {
    fontSize: 12,
    color: theme.palette.grey[500],
    marginBottom: 4,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '8px 0',
  },
  runAgainButton: {
    cursor: 'pointer',
    fontSize: 13,
    padding: '4px 12px',
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[700],
    border: 'none',
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
    },
  },
}));

const UserReviewDialog = ({onClose, reviewerName, reviews, onRunAgain, loading}: {
  onClose: () => void,
  reviewerName: string,
  reviews: string[],
  onRunAgain: () => void,
  loading: boolean,
}) => {
  const classes = useStyles(styles);
  return <LWDialog open onClose={onClose} dialogClasses={{ paper: '' }} title={`${reviewerName} Review`}>
    <DialogContent>
      {reviews.map((review, i) => (
        <div key={i} className={classes.reviewBlock}>
          {reviews.length > 1 && <div className={classes.reviewLabel}>Run {i + 1}</div>}
          {review}
        </div>
      ))}
      <div className={classes.footer}>
        {loading
          ? <Loading />
          : <button className={classes.runAgainButton} onClick={onRunAgain}>Run Again</button>
        }
      </div>
    </DialogContent>
  </LWDialog>;
};

export default UserReviewDialog;
