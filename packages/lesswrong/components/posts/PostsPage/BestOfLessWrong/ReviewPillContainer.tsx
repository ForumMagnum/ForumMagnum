import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { useStyles, defineStyles } from '@/components/hooks/useStyles';
import { HashLink } from '@/components/common/HashLink';
import { hideScrollBars } from '@/themes/styleUtils';
import UsersName from "../../../users/UsersName";
import CommentBody from "../../../comments/CommentsItem/CommentBody";
import SmallSideVote from "../../../votes/SmallSideVote";
import LWTooltip from "../../../common/LWTooltip";
import UsersNameDisplay from "../../../users/UsersNameDisplay";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const CommentWithRepliesFragmentMultiQuery = gql(`
  query multiCommentReviewPillContainerQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentWithRepliesFragment
      }
      totalCount
    }
  }
`);

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
  },
}));

const ReviewPreview = ({review}: {review: CommentsList}) => {
  const classes = useStyles(styles);
  return <div className={classes.reviewPreviewContainer}>
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
}

const ReviewPillContainer = ({postId}: {postId: string}) => {
  const classes = useStyles(styles);

  const { data } = useQuery(CommentWithRepliesFragmentMultiQuery, {
    variables: {
      selector: { reviews: { postId: postId, minimumKarma: 5 } },
      limit: 5,
      enableTotal: false,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const reviews = data?.comments?.results;
  return <AnalyticsContext pageElementContext="reviewPillContainer">
    <div className={classes.root}>
      {reviews?.map((review) => (
        <LWTooltip key={review._id} title={<ReviewPreview review={review} />} tooltip={false} placement="bottom-start" flip={false} clickable={true}>
          <HashLink key={review._id} to={`#${review._id}`}>
            <div className={classes.review}>
              Review by
              <div className={classes.reviewerName}>
                <UsersNameDisplay noTooltip user={review.user} />
              </div>
            </div>
          </HashLink>
        </LWTooltip>
      ))}
  </div>
  </AnalyticsContext>
}

export default ReviewPillContainer;
