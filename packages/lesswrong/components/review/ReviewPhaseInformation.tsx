import React from 'react';
import { annualReviewAnnouncementPostPathSetting } from '../../lib/publicSettings';
import { Link } from '../../lib/reactRouterWrapper';
import { ReviewPhase, ReviewYear } from '../../lib/reviewUtils';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { commentBodyStyles } from '../../themes/stylePiping';
import Card from '@material-ui/core/Card';

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
  },
  faqCard: {
    width: 400,
    padding: 16,
  },
  faqQuestion: {
    color: theme.palette.primary.main
  },
});

export const ReviewPhaseInformation = ({classes, reviewYear, reviewPhase}: {
  classes: ClassesType,
  reviewYear: ReviewYear,
  reviewPhase: ReviewPhase
}) => {

  const { UserReviewsProgressBar, ContentStyles, LWTooltip, ReviewVotingProgressBar } = Components


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
      <b>Posts need at least 1 review to enter the Final Voting Phase</b>
      <p>In the right-column are posts which were upvoted during the Nomination Voting Phase, but which haven't gotten a review yet. Write reviews for any posts which you benefited from, or you think you might have something informative to say about.</p>
      <p><b>If you review 3 posts, you have done your civic duty</b></p>
      <p>Let's be real, there's a hella lotta posts you could review. But if you review three posts, as far as the LessWrong team is concerned you can call it a day and bask in the warm glow of knowing you helped the site reflect upon itself, improving our longterm reward signal.</p>
      <UserReviewsProgressBar reviewYear={reviewYear} />
      <p><b>Review Prizes</b></p>
      <p>It's fine to write quick reviews that simply describe how the post has influenced you. But the LessWrong team is also interested in reviews that engage deeply with a post's factual claims, arguments or broader implications. We're offering prizes of $50 - $500 for reviews that add substantive new information.</p>
      <p>
        Read more details in <Link to={annualReviewAnnouncementPostPathSetting.get()}> this year's review announcement</Link>.
      </p>
    </ContentStyles>;
  }

  if (reviewPhase === "VOTING") {
    return <ContentStyles contentType="comment" className={classes.root}>
      <p><b>Final Voting Phase</b></p>
      <p>We just spent a month reviewing posts. Now it's time to look at posts that got at least one review, look over any reviews you think might have useful context, and cast your final vote.</p>
      <p>Vote positively for posts that you think have stood the tests of time as particularly important. Vote negatively for posts you think are misleading, harmful, or seem overrated/unimportant.</p>
      <p>Highly upvoted posts will be printed into a physical book, and included in the <Link to="/bestoflesswrong">Best of LessWrong</Link> page. (The LessWrong Team may make some judgment calls on the exact cutoff of which posts appear in the physical book).</p>
      <p>
        <ReviewVotingProgressBar reviewYear={reviewYear} />
      </p>
      <p><b>FAQ</b></p>
      <p className={classes.faqQuestion}>
        <FaqCard linkText="How exactly does Final Voting work?">
          <p>If you intuitively sort posts into "good", "important", "crucial", you'll probably do fine. But here are some details on how it works under-the-hood:</p>
          <p>Each vote-button corresponds to a relative strength: 1x, 4x, or 9x. Your "9" votes are 9x as powerful as your "1" votes. But, voting power is normalized so that everyone ends up with roughly the same amount of influence. If you mark every post you like as a "9", you'll probably spend more than 500 points, and your "9" votes will end up weaker than someone who used them more sparingly.</p>
          <p>On the "backend" the system uses our <Link to="/posts/qQ7oJwnH9kkmKm2dC/feedback-request-quadratic-voting-for-the-2018-review">quadratic voting system</Link>, giving you a 500 points and allocating them to match the relative strengths of your vote-choices. A 4x vote costs 10 points, a 9x costs 45.</p>
        </FaqCard>
      </p>

      <p className={classes.faqQuestion}>
        <FaqCard linkText="Who is eligible?">
          <ul>
            <li>Any user registered before {reviewYear} can vote on posts.</li>
            <li>Votes by users with 1000+ karma will be weighted more highly by the moderation team when assembling the final sequence, books or prizes.</li>
            <li>Any user can write reviews.</li>
          </ul>
        </FaqCard>
      </p>
      <p>
        Read more details in <Link to={annualReviewAnnouncementPostPathSetting.get()}> this year's review announcement</Link>.
      </p>
    </ContentStyles>
  }

  if (reviewPhase === "NOMINATIONS") {
    return <ContentStyles contentType="comment" className={classes.root}>
        <p>During the <em>Nomination Voting Phase</em>, eligible users are encouraged to:</p>
        <ul>
          <li>
            Vote on posts that represent important intellectual progress.
          </li>
          <li>Write short reviews that explain why those posts seem important</li>
        </ul> 
        <p>Posts with at least one positive vote will appear on this page, to the right. Posts with at least one review are sorted to the top, to make them easier to vote on.</p>
  
        <p>At the end of the Nomination Voting phase, the LessWrong team will publish a ranked list of the results. This will help inform how to spend attention during <em>the Review Phase</em>. High-ranking, undervalued or controversial posts can get additional focus.</p>
        
        <div>
          <p><b>FAQ</b></p>
          <p className={classes.faqQuestion}>
            <FaqCard linkText="How exactly do Nomination Votes work?">
              <p>If you intuitively sort posts into "good", "important", "crucial", you'll probably do fine. But here are some details on how it works under-the-hood:</p>
              <p>Each vote-button corresponds to a relative strength: 1x, 4x, or 9x. Your "9" votes are 9x as powerful as your "1" votes. But, voting power is normalized so that everyone ends up with roughly the same amount of influence. If you mark every post you like as a "9", you'll probably spend more than 500 points, and your "9" votes will end up weaker than someone who used them more sparingly.</p>
              <p>On the "backend" the system uses our <Link to="/posts/qQ7oJwnH9kkmKm2dC/feedback-request-quadratic-voting-for-the-2018-review">quadratic voting system</Link>, giving you a 500 points and allocating them to match the relative strengths of your vote-choices. A 4x vote costs 10 points, a 9x costs 45.</p>
              <p>You can change your votes during the Final Voting Phase.</p>
            </FaqCard>
          </p>
  
          <p className={classes.faqQuestion}>
            <FaqCard linkText="How many votes does a post need to proceed to the Review Phase?">
              <p>Posts will need at least two positive Preliminary Votes to proceed to the Review Phase.</p>
            </FaqCard>
          </p>

          <p className={classes.faqQuestion}>
            <FaqCard linkText="Who is eligible?">
              <ul>
                <li>Any user can write reviews.</li>
                <li>Any user registered before {reviewYear} can vote on posts.</li>
                <li>Votes by users with 1000+ karma will be weighted more highly by the moderation team when assembling the final sequence, books or prizes.</li>
              </ul>
            </FaqCard>
          </p>
        </div>
        <br />
        <p>
          Read more details in <Link to={annualReviewAnnouncementPostPathSetting.get()}> this year's review announcement</Link>.
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

