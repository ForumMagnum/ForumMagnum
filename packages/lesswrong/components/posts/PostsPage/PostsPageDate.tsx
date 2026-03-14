import React from 'react';
import FormatDate, { ExpandedDate } from '../../common/FormatDate';
import moment from 'moment';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { useCurrentTime } from '../../../lib/utils/timeUtil';
import PostsRevisionSelector from "./PostsRevisionSelector";
import LWTooltip from "../../common/LWTooltip";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("PostsPageDate", (theme: ThemeType) => ({
  date: {
    color: 'inherit',
    fontSize: 'inherit',
    cursor: 'default'
  },
  mobileDate: {
    [theme.breakpoints.up('md')]: {
      display:"none"
    }
  }
}));

const PostsPageDate = ({ post, hasMajorRevision }: {
  post: PostsBase,
  hasMajorRevision: boolean,
}) => {
  const classes = useStyles(styles);
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
  
  return <LWTooltip title={tooltip} placement="bottom">
    <span className={classes.date}>
      <FormatDate date={post.postedAt} format={"Do MMM YYYY"} tooltip={false} />
    </span>
  </LWTooltip>
}

export default PostsPageDate;


