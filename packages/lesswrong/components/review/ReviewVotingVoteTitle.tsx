// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { ReviewPhase, ReviewYear } from '@/lib/reviewUtils';
import { commentBodyStyles, postBodyStyles } from '@/themes/stylePiping';

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    padding: 24,
    ...commentBodyStyles(theme),
    '& h1': {
      fontSize: '2.25rem'
    },
    '& p': {
      margin: '.25em'
    },
    marginTop: 48,
    marginBottom: 12
  }
});

export const ReviewVotingVoteTitle = ({classes, reviewPhase, reviewYear}: {
  classes: ClassesType<typeof styles>,
  reviewPhase: ReviewPhase,
  reviewYear: ReviewYear,
}) => {
  const { SectionTitle } = Components
  return <div className={classes.root}>
    {reviewPhase === "NOMINATIONS" && <div>
      <p>Vote for posts that were important intellectual progress.</p>
      <p>Posts need 2 votes to proceed.</p>
      <p>Write short reviews explaining why a post was valuable.</p>
    </div>}
    {reviewPhase === "REVIEWS" && <SectionTitle title="Posts with 1+ review" />}
    {reviewPhase === "REVIEWS" && <p>Posts with at least 1 review vote appear here. Vote for posts that represent important intellectual progress.</p>}
    {reviewPhase === "VOTING" && <SectionTitle title="Final Voting" />}
    {reviewPhase === "RESULTS" && <SectionTitle title="Best of Review Results" />}
  </div>;
}

const ReviewVotingVoteTitleComponent = registerComponent('ReviewVotingVoteTitle', ReviewVotingVoteTitle, {styles});

declare global {
  interface ComponentTypes {
    ReviewVotingVoteTitle: typeof ReviewVotingVoteTitleComponent
  }
}
