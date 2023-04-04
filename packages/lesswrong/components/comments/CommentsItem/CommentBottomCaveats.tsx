import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useCurrentTime } from '../../../lib/utils/timeUtil';
import { commentIsHidden } from '../../../lib/collections/comments/helpers';

const styles = (theme: ThemeType): JssStyles => ({
  blockedReplies: {
    padding: "5px 0",
  },
});

const CommentBottomCaveats = ({comment, classes}: {
  comment: CommentsList,
  classes: ClassesType,
}) => {
  const now = useCurrentTime();
  const blockedReplies = comment.repliesBlockedUntil && new Date(comment.repliesBlockedUntil) > now;
  
  return <>
    { blockedReplies &&
      <div className={classes.blockedReplies}>
        A moderator has deactivated replies on this comment until <Components.CalendarDate date={comment.repliesBlockedUntil}/>
      </div>
    }
    { comment.retracted && <Components.MetaInfo>[This comment is no longer endorsed by its author]</Components.MetaInfo>}
    { commentIsHidden(comment) && <Components.MetaInfo>
      [This comment will not be visible to other users until the moderation
      team checks it for spam or norm violations.]
    </Components.MetaInfo>
    }
  </>
}

const CommentBottomCaveatsComponent = registerComponent("CommentBottomCaveats", CommentBottomCaveats, {styles});

declare global {
  interface ComponentTypes {
    CommentBottomCaveats: typeof CommentBottomCaveatsComponent
  }
}
