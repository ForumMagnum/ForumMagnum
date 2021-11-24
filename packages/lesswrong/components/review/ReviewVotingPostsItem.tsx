import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { reviewVotingButtonStyles } from './ReviewVotingButtons';

const styles = (theme) => ({
  root: {
    ...theme.typography.smallText,
    ...theme.typography.commentStyle,
    padding: 4,
    color: theme.palette.grey[700],
    cursor: "pointer",
    border: "solid 1px #ddd",
    borderRadius: 2,
    marginRight: 8,
    '&:hover': {
      background: "#eee"
    }
  },
  reviewVotingFull: {
    background: "white",
    ...theme.typography.smallText,
    ...theme.typography.commentStyle,
    padding: 12,
    borderRadius: 2
  }
})

const ReviewVotingPostsItem = ({classes, post}:{classes: ClassesType, post: PostsList}) => {
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const { ReviewVotingButtons, PopperCard } = Components
  return <div className={classes.root} onMouseLeave={() => setAnchorEl(null)} onClick={(e) => setAnchorEl(e.target)}>
        Vote
        {anchorEl && <PopperCard open={Boolean(anchorEl)} anchorEl={anchorEl} placement="right">
          <div className={classes.reviewVotingFull}>
            <p>Should this post be considered for the {2020} Review?</p>
            <p></p>
            <ReviewVotingButtons postId={post._id} />
          </div>
        </PopperCard>}
      </div>
}

const ReviewVotingPostsItemComponent = registerComponent('ReviewVotingPostsItem', ReviewVotingPostsItem, {styles});

declare global {
  interface ComponentTypes {
    ReviewVotingPostsItem: typeof ReviewVotingPostsItemComponent
  }
}

