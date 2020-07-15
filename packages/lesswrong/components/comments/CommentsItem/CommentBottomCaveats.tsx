import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';

const styles = theme => ({
  blockedReplies: {
    padding: "5px 0",
  },
});

const CommentBottomCaveats = ({comment, classes}: {
  comment: CommentsList,
  classes: ClassesType,
}) => {
  const blockedReplies = comment.repliesBlockedUntil && new Date(comment.repliesBlockedUntil) > new Date();
  
  return <>
    { blockedReplies &&
      <div className={classes.blockedReplies}>
        A moderator has deactivated replies on this comment until <Components.CalendarDate date={comment.repliesBlockedUntil}/>
      </div>
    }
    { comment.retracted && <Components.MetaInfo>[This comment is no longer endorsed by its author]</Components.MetaInfo>}
  </>
}

const CommentBottomCaveatsComponent = registerComponent("CommentBottomCaveats", CommentBottomCaveats, {styles});

declare global {
  interface ComponentTypes {
    CommentBottomCaveats: typeof CommentBottomCaveatsComponent
  }
}
