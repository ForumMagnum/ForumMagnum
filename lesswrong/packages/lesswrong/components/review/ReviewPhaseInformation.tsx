import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { ReviewPhase, reviewPostPath, ReviewYear } from '../../lib/reviewUtils';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { commentBodyStyles } from '../../themes/stylePiping';
import Card from '@material-ui/core/Card';
import ReviewProgressNominations from "@/components/review/ReviewProgressNominations";
import ReviewProgressReviews from "@/components/review/ReviewProgressReviews";
import { ContentStyles } from "@/components/common/ContentStyles";
import LWTooltip from "@/components/common/LWTooltip";
import ReviewProgressVoting from "@/components/review/ReviewProgressVoting";

const styles = (theme: ThemeType) => ({
  root: {
    padding: 16,
    paddingTop: 6,
    paddingBottom: 6,
    ...commentBodyStyles(theme),
    background: theme.palette.panelBackground.default,
    boxShadow: theme.palette.boxShadow.default,
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
    '& p': {
      marginTop: '.6em',
      marginBottom: '.6em'
    }
  },
  faqCard: {
    width: 400,
    padding: 16,
  },
  faqQuestion: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dashed',
    textDecorationColor: theme.palette.text.dim4,
    textUnderlineOffset: '3px'
  },
});

export const ReviewPhaseInformation = ({classes, reviewYear, reviewPhase}: {
  classes: ClassesType<typeof styles>,
  reviewYear: ReviewYear,
  reviewPhase: ReviewPhase
}) => {
  // FIXME: Unstable component will lose state on rerender
  // eslint-disable-next-line react/no-unstable-nested-components
  const FaqCard = ({linkText, children}: {
    linkText: React.ReactNode,
    children: React.ReactNode,
  }) => (
    <LWTooltip tooltip={false} clickable title={
      <Card className={classes.faqCard}>
        <ContentStyles contentType="comment">
          {children}
        </ContentStyles>
      </Card>}
    >
      {linkText}
    </LWTooltip>
  )

  if (reviewPhase === "REVIEWS") {
    return <ContentStyles contentType="comment" className={classes.root}>
      <p>Posts need at least 1 review to enter the Final Voting Phase</p>
      <p>If you write 3 reviews, you've done your civic duty.</p>
      <p>Reviews with 10+ karma will appear on the Best of LessWrong page.</p>
      <p><em>Moderators will upvote reviews that are share novel information, such as specific flaws that hadn't been mentioned before, or specific ways the post has proven valuable.</em></p>
      <ReviewProgressReviews reviewYear={reviewYear} />
      <p>
        <Link to={reviewPostPath}>Learn more</Link>
      </p>
    </ContentStyles>;
  }

  if (reviewPhase === "VOTING") {
    return <ContentStyles contentType="comment" className={classes.root}>
      <p><b>Final Voting Phase</b></p>
      <p>Posts with at least one review are eligible for final voting.</p>
      <p>Vote for posts that have stood the tests of time as particularly important.</p>
      <p>
        <ReviewProgressVoting reviewYear={reviewYear} />
      </p>
      <p>
        <Link to={reviewPostPath}>Learn more</Link>
      </p>
    </ContentStyles>
  }

  if (reviewPhase === "NOMINATIONS") {
    return <ContentStyles contentType="comment" className={classes.root}>
      <p>Cast <em>Nomination Votes</em> on posts that represent important intellectual progress.</p>
      <p>Posts need 2+ votes to proceed.</p>
      <p><b><em>The Ask</em>: Spend ~30 minutes nominating, and write 2 short reviews about posts you found valuable.</b></p>
      <p>
        <ReviewProgressNominations reviewYear={reviewYear} /> 
      </p>
      <p>
        <Link to={reviewPostPath}>Learn more</Link>
      </p>
    </ContentStyles>
  }
  return <ContentStyles contentType="comment" className={classes.root}>
    The {reviewYear} Review is complete.
  </ContentStyles>
}

const ReviewPhaseInformationComponent = registerComponent('ReviewPhaseInformation', ReviewPhaseInformation, {styles});

declare global {
  interface ComponentTypes {
    ReviewPhaseInformation: typeof ReviewPhaseInformationComponent
  }
}

export default ReviewPhaseInformationComponent;

