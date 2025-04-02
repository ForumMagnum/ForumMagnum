import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { useStyles, defineStyles } from '@/components/hooks/useStyles';
import { useMulti } from '@/lib/crud/withMulti';
import { HashLink } from '@/components/common/HashLink';
import { hideScrollBars } from '@/themes/styleUtils';

const styles = defineStyles("ReviewPillContainer", (theme: ThemeType) => ({ 
  root: {
    paddingTop: 24,
    display: 'flex',
    gap: '8px',
    ...theme.typography.body2,
    fontSize: '1.1rem',
    flexWrap: 'wrap',
  },
  review: {
    cursor: 'pointer',
    display: 'flex',
    padding: '3px 10px 4px 10px',
    borderRadius: '3px',
    backgroundColor: theme.palette.panelBackground.reviewGold,
    gap: '7px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
    color: theme.palette.text.alwaysWhite,
  },
  reviewPreviewContainer: {
    paddingTop: 8,
    minHeight: 0
  },
  reviewPreview: {
    ...theme.typography.commentStyle,
    transition: 'opacity 0.2s ease-in-out',
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    border: `1px solid ${theme.palette.panelBackground.reviewGold}`,
    padding: '8px',
    width: '650px',
    maxWidth: '70vw',
    whiteSpace: 'normal',
    textAlign: 'left',
    borderRadius: '3px',
    marginLeft: 'auto',
    marginRight: 'auto',
    overflowY: 'scroll',
    ...hideScrollBars,
    maxHeight: '100%'
  },
  reviewMeta: {
    display: 'flex',
    ...theme.typography.body2,
    gap: '8px',
    alignItems: 'center',
  },
  reviewPreviewYear: {
    fontSize: '1rem',
    color: theme.palette.primary.dark,
    fontStyle: 'italic',
  },
  reviewerName: {
    marginLeft: -3
  }
}));

const ReviewPillContainer = ({postId}: {postId: string}) => {
  const classes = useStyles(styles);

  const { results: reviews } = useMulti({
    terms: {
      view: "reviews",
      postId: postId,
      minimumKarma: 5
    },
    collectionName: "Comments",
    fragmentName: 'CommentWithRepliesFragment',
    fetchPolicy: 'cache-and-network',
    limit: 5
  });

  const { LWTooltip, UsersName, CommentBody, SmallSideVote, UsersNameDisplay } = Components;

  const reviewPreview = (review: CommentsList) => <div className={classes.reviewPreviewContainer}>
    <div className={classes.reviewPreview}>
      <div className={classes.reviewMeta}>
        <div className={classes.reviewerName}><UsersName user={review.user} /></div>
        <SmallSideVote document={review} collectionName="Comments" />
        <span className={classes.reviewPreviewYear}>Review for {review.reviewingForReview} Review</span>
      </div>
      <div>
        <CommentBody comment={review} />
      </div>
    </div>
  </div>
  
  return <AnalyticsContext pageElementContext="reviewPillContainer">
    <div className={classes.root}>
      {reviews?.map((review) => (
        <LWTooltip key={review._id} title={reviewPreview(review)} tooltip={false} placement="bottom-start" flip={false} clickable={true}>
          <HashLink key={review._id} to={`#${review._id}`}>
            <div className={classes.review}>
              Review by
              <div className={classes.reviewerName}>
                <UsersNameDisplay user={review.user} />
              </div>
            </div>
          </HashLink>
        </LWTooltip>
      ))}
  </div>
  </AnalyticsContext>
}

const ReviewPillContainerComponent = registerComponent('ReviewPillContainer', ReviewPillContainer);

declare global {
  interface ComponentTypes {
    ReviewPillContainer: typeof ReviewPillContainerComponent
  }
}

export default ReviewPillContainer;
