import React, { useState } from 'react';
import { reviewIsActive, REVIEW_YEAR } from '../../lib/reviewUtils';
import { registerComponent } from '../../lib/vulcan-lib/components';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import PostsNewForm from "../posts/PostsNewForm";
import SingleColumnSection from "../common/SingleColumnSection";
import Row from "../common/Row";

const styles = (theme: ThemeType) => ({
  text: {
    ...theme.typography.body2,
    width: 680,
    margin: "auto",
    marginBottom: 60,
    border: theme.palette.border.faint,
    borderRadius: 5,
    paddingTop: 10,
    padding: 30,
    paddingBottom: 10
  }
});

export const NewLongformReviewForm = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [showText, setShowText] = useState(true)

  if (!reviewIsActive()) {
    return <SingleColumnSection>
      <h2>The {REVIEW_YEAR} is over.</h2>
    </SingleColumnSection>
  }

  return <div>
    {showText && <div className={classes.text}>
      <h2>Write a longform review</h2>
      <p>Write a broader review, as a top-level post. This can cover a wide variety of "review shaped" thoughts, like:</p>
      <ul>
        <li>An in-depth response to a single post.</li>
        <li>Examine what high level themes seemed sigificant among {REVIEW_YEAR} posts.</li>
        <li>What important updates did you make in {REVIEW_YEAR}? How could you have made them faster?</li>
        <li>Any other meta-reflection on LessWrong, or how your thought processes have evolved in the past 2 years.</li>
      </ul>
      <p>If you're reviewing a specific single-post in depth, you should also write a short comment review linking to this post.</p>
      <Row justifyContent="flex-end">
        <Button onClick={() => setShowText(false)}>Click to hide</Button>
      </Row>
    </div>}
    <PostsNewForm />
  </div>;
}

export default registerComponent('NewLongformReviewForm', NewLongformReviewForm, {styles});



