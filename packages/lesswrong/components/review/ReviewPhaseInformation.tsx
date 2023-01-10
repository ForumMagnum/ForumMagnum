import React from 'react';
import { ReviewYear } from '../../lib/reviewUtils';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { commentBodyStyles } from '../../themes/stylePiping';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 16,
    marginBottom: 24,
    ...commentBodyStyles(theme),
    background: theme.palette.panelBackground.default,
    boxShadow: theme.palette.boxShadow.default,
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  }
});

export const ReviewPhaseInformation = ({classes, reviewYear}: {
  classes: ClassesType,
  reviewYear: ReviewYear
}) => {

  const { UserReviewsProgressBar } = Components

  return <div className={classes.root}>
    <div className={classes.instructions}>
      <b>Posts need at least 1 review to enter the Final Voting Phase</b>
      <p>In the right-column are posts which were upvoted during the Nomination Voting Phase, but which haven't gotten a review yet. Write reviews for any posts which you benefited from, or you think you might have something informative to say about.</p>
      <p><b>If you review 3 posts, you have done your civic duty</b></p>
      <p>Let's be real, there's a hella lotta posts you could review. But if you review three posts, as far as the LessWrong team is concerned you can call it a day and bask in the warm glow of knowing you helped the site reflect upon itself, improving our longterm reward signal.</p>
      <UserReviewsProgressBar reviewYear={reviewYear} />
      <p><b>Review Prizes</b></p>
      <p>It's fine to write quick reviews that simply describe how the post has influenced you. But the LessWrong team is also interested in reviews that engage deeply with a post's factual claims, arguments or broader implications. We're offering prizes of $50 - $500 for reviews that add substantive new information.</p>
    </div>
  </div>;
}

const ReviewPhaseInformationComponent = registerComponent('ReviewPhaseInformation', ReviewPhaseInformation, {styles});

declare global {
  interface ComponentTypes {
    ReviewPhaseInformation: typeof ReviewPhaseInformationComponent
  }
}

