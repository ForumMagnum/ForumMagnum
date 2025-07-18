import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import FormatDate, { ExpandedDate } from '../../common/FormatDate';
import moment from 'moment';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { useCurrentTime } from '../../../lib/utils/timeUtil';
import PostsRevisionSelector from "./PostsRevisionSelector";
import LWTooltip from "../../common/LWTooltip";

const styles = (theme: ThemeType) => ({
  date: {
    color: theme.palette.text.dim3,
    fontSize: isFriendlyUI ? undefined : theme.typography.body2.fontSize,
    cursor: 'default'
  },
  mobileDate: {
    [theme.breakpoints.up('md')]: {
      display:"none"
    }
  }
});

const PostsPageDate = ({ post, hasMajorRevision, classes }: {
  post: PostsBase,
  hasMajorRevision: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const now = moment(useCurrentTime())
  const tooltip = (<div>
    <div>Posted on <ExpandedDate date={post.postedAt}/></div>
    
    {post.curatedDate && <div>
      Curated on <ExpandedDate date={post.curatedDate}/>
    </div>}
  </div>);

  if (hasMajorRevision) {
    return (
      <span className={classes.date}>
        <PostsRevisionSelector format="Do MMM YYYY" post={post}/>
      </span>
    )
  }
  
  let format = "Do MMM YYYY"
  if (isFriendlyUI) {
    format = "MMM D YYYY"
    // hide the year if it's this year
    if (now.isSame(moment(post.postedAt), 'year')) {
      format = "MMM D"
    }
  }
  
  return <LWTooltip title={tooltip} placement="bottom">
    <span className={classes.date}>
      <FormatDate date={post.postedAt} format={format} tooltip={false} />
    </span>
  </LWTooltip>
}

export default registerComponent("PostsPageDate", PostsPageDate, {styles});


