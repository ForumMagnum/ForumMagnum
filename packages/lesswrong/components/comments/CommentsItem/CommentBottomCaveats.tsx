import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useCurrentTime } from '../../../lib/utils/timeUtil';
import { commentIsHidden } from '../../../lib/collections/comments/helpers';
import moment from 'moment';

const styles = (theme: ThemeType) => ({
  caveatText: {
    flexGrow: 1,
  },
  blockedReplies: {
    padding: "5px 0",
  },
});

const CommentBottomCaveats = ({comment, classes}: {
  comment: CommentsList,
  classes: ClassesType<typeof styles>,
}) => {
  const now = useCurrentTime();
  const blockedReplies = comment.repliesBlockedUntil && new Date(comment.repliesBlockedUntil) > now;
  
  // If replies are blocked for a duration >100y, just say "blocked" and don't mention an expiration date
  const blockDurationYrs: number|null = blockedReplies
    ? moment(comment.repliesBlockedUntil).diff(now, 'years')
    : null;
  const blockIsForever = blockDurationYrs && blockDurationYrs>=100;
  
  return <>
    { blockedReplies &&
      <div className={classes.blockedReplies}>
        A moderator has deactivated replies on this comment{" "}
        {!blockIsForever && <>until <Components.CalendarDate date={comment.repliesBlockedUntil}/></>}
      </div>
    }
    {comment.retracted
      && <Components.MetaInfo className={classes.caveatText}>
        [This comment is no longer endorsed by its author]
      </Components.MetaInfo>
    }
    {commentIsHidden(comment) && !comment.rejected
      && <Components.MetaInfo className={classes.caveatText}>
        [This comment will not be visible to other users until the moderation team has reviewed it.]
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
