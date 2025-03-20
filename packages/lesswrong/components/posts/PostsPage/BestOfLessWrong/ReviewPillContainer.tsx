// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { AnalyticsContext, useTracking } from '@/lib/analyticsEvents';
import { useStyles, defineStyles } from '@/components/hooks/useStyles';
import { useMulti } from '@/lib/crud/withMulti';
import { HashLink } from '@/components/common/HashLink';
import { hideScrollBars } from '@/themes/styleUtils';

const styles = defineStyles("ReviewPillContainer", (theme: ThemeType) => ({ 
  root: {
    paddingTop: 10,
    display: 'flex',
    gap: '8px'
  },
  review: {
    cursor: 'pointer',
    display: 'flex',
    padding: '4px',
    borderRadius: '4px',
    backgroundColor: theme.palette.panelBackground.reviewGold,
    gap: '7px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
    color: theme.palette.text.alwaysWhite,
  },
  reviewPreviewContainer: {
    padding: '16px',
    minHeight: 0
  },
  reviewPreview: {
    ...theme.typography.commentStyle,
    transition: 'opacity 0.2s ease-in-out',
    backgroundColor: theme.palette.panelBackground.translucent2,
    border: `1px solid ${theme.palette.panelBackground.reviewGold}`,
    padding: '8px',
    width: '650px',
    maxWidth: '70vw',
    whiteSpace: 'normal',
    textAlign: 'left',
    borderRadius: '8px',
    marginLeft: 'auto',
    marginRight: 'auto',
    overflowY: 'scroll',
    ...hideScrollBars,
    maxHeight: '100%'
  },
  reviewPreviewAuthor: {
    fontWeight: '600'
  },
}));

const ReviewPillContainer = ({postId}: {postId: string}) => {
  const classes = useStyles(styles);

  const { results: reviews } = useMulti({
    terms: {
      view: "reviews",
      postId: postId,
    },
    collectionName: "Comments",
    fragmentName: 'CommentWithRepliesFragment',
    fetchPolicy: 'cache-and-network',
    limit: 5
  });

  const { LWTooltip, UsersName, CommentBody } = Components;

  const reviewPreview = (review: CommentsList) => <div className={classes.reviewPreviewContainer}>
    <div className={classes.reviewPreview}>
      <div className={classes.reviewPreviewAuthor}>
        <UsersName user={review.user} />
      </div>
      <div>
        <CommentBody comment={review} />
      </div>
    </div>
  </div>
  
  return <AnalyticsContext pageElementContext="reviewPillContainer">
    <div className={classes.root}>
      {reviews?.map((review) => (
        <LWTooltip key={review._id} title={reviewPreview(review)} tooltip={false} placement="bottom-start">
          <HashLink key={review._id} to={`#${review._id}`}>
          <div className={classes.review}>
            <div>
            {review.baseScore}
          </div>
          <div>
            {review?.user?.displayName || "Anonymous"}
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
