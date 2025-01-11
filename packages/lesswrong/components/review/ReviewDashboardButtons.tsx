import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { ReviewPhase, ReviewYear } from '../../lib/reviewUtils';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { userIsAdmin } from '../../lib/vulcan-users';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType) => ({
  actionButton: {
    border: `solid 1px ${theme.palette.grey[400]}`,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 3,
    color: theme.palette.grey[600],
    ...theme.typography.commentStyle,
    display: "inline-block",
    marginLeft: 10
  },
  actionButtonCTA: {
    backgroundColor: theme.palette.primary.main,
    border: `solid 1px ${theme.palette.primary.main}`,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 3,
    color: theme.palette.text.invertedBackgroundText,
    ...theme.typography.commentStyle,
    marginLeft: 10,
    display: "flex",
    alignItems: "center"
  }
});

export const ReviewDashboardButtons = ({classes, reviewYear, reviewPhase, showAdvancedDashboard, showQuickReview}: {
  classes: ClassesType<typeof styles>,
  reviewYear: ReviewYear,
  reviewPhase: ReviewPhase,
  showAdvancedDashboard?: boolean,
  showQuickReview?: boolean
}) => {
  const { Row, SectionFooter, LWTooltip } = Components 
  const currentUser = useCurrentUser()

  return <div>
    <Row justifyContent="space-between">
      <SectionFooter>
        {userIsAdmin(currentUser) && <LWTooltip title={`Look at metrics related to the Review`}>
          <Link to={`/reviewAdmin/${reviewYear}`}>
            Review Admin
          </Link>
        </LWTooltip>}
        {reviewPhase === "NOMINATIONS" && <LWTooltip title={`Look over your upvotes from ${reviewYear}. (This is most useful during the nomination phase, but you may still enjoy looking them over in the latter phases to help compare)`}>
          <Link to={`/votesByYear/${reviewYear}`}>
            Nominate Posts
          </Link>
        </LWTooltip>}
        <LWTooltip title={`Look at all reviews (from this year or other years)`}>
          <Link to={`/reviews/${reviewYear}`}>
            All Reviews
          </Link>
        </LWTooltip>
        {showAdvancedDashboard && <LWTooltip title="Look at reviews, update your votes, and see more detailed info from the Nomination Vote results">
          <Link to={`/reviewVoting/${reviewYear}`}>
            Advanced Review
          </Link>
        </LWTooltip>}
        {showQuickReview && <LWTooltip title="A simplified review UI">
          <Link to={`/reviewQuickPage`}>
            Quick Review Page
          </Link>
        </LWTooltip>}
      </SectionFooter>
      <div>
        <LWTooltip title={<div>
          <p>Write a broader review, as a top-level post. This can cover a wide variety of "Review shaped" thoughts, like:</p>
          <ul>
            <li>What high level themes seemed sigificant among {reviewYear} posts?</li>
            <li>An in-depth response to a single post.</li>
            <li>What important updates did you make in {reviewYear}? How could you have made them faster?</li>
            <li>Any other meta-reflection on LessWrong, or how your thought processes have evolved since {reviewYear}.</li>
          </ul>
        </div>}>
          <Link to={"/newLongformReview"} className={classes.actionButtonCTA}>
            Write a Longform Review
          </Link>
        </LWTooltip>
      </div>
    </Row>
  </div>;
}

const ReviewDashboardButtonsComponent = registerComponent('ReviewDashboardButtons', ReviewDashboardButtons, {styles});

declare global {
  interface ComponentTypes {
    ReviewDashboardButtons: typeof ReviewDashboardButtonsComponent
  }
}

