import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { ExpandedDate } from '../common/FormatDate';
import moment from '../../lib/moment-timezone';

export const POSTED_AT_WIDTH = 38
export const START_TIME_WIDTH = 72

const styles = (theme: ThemeType): JssStyles => ({
  postedAt: {
    '&&': {
      cursor: "pointer",
      width: POSTED_AT_WIDTH,
      fontSize: "1rem",
      [theme.breakpoints.down('xs')]: {
        width: "auto",
      }
    }
  },
  startTime: {
    '&&': {
      cursor: "pointer",
      width: START_TIME_WIDTH,
      fontSize: "1rem",
      [theme.breakpoints.down('xs')]: {
        width: "auto",
      }
    }
  },
  tooltipSmallText: {
    ...theme.typography.tinyText,
    ...theme.typography.italic,
  },
});

const PostsItemDate = ({post, classes}: {
  post: PostsBase,
  classes: ClassesType,
}) => {
  const { PostsItem2MetaInfo, FormatDate, LWTooltip } = Components;

  if (post.isEvent && post.startTime) {
    return <LWTooltip
      placement="right"
      title={<span>
        <div className={classes.tooltipSmallText}>Event starts at</div>
        <Components.EventTime post={post} />
      </span>}
    >
      <PostsItem2MetaInfo className={classes.startTime}>
        {moment(post.startTime).format("YYYY")===moment().format("YYYY")
          ? <FormatDate date={post.startTime} format={"MMM Do"} tooltip={false}/>
          : <FormatDate date={post.startTime} format={"YYYY MMM Do"} tooltip={false}/>
        }
      </PostsItem2MetaInfo>
    </LWTooltip>
  }

  if (post.isEvent && !post.startTime) {
    return <LWTooltip
      placement="right"
      title={<span>To Be Determined</span>}
    >
      <PostsItem2MetaInfo className={classes.startTime}>
        TBD
      </PostsItem2MetaInfo>
    </LWTooltip>
  }

  if (post.curatedDate) {
    return <LWTooltip
      placement="right"
      title={<div>
        <div>Curated on <ExpandedDate date={post.curatedDate}/></div>
        <div>Posted on <ExpandedDate date={post.postedAt}/></div>
      </div>}
    >
      <PostsItem2MetaInfo className={classes.postedAt}>
        {moment(new Date(post.curatedDate)).fromNow()}
      </PostsItem2MetaInfo>
    </LWTooltip>
  }

  return <LWTooltip
    placement="right"
    title={<ExpandedDate date={post.postedAt}/>}
  >
    <PostsItem2MetaInfo className={classes.postedAt}>
      {moment(new Date(post.postedAt)).fromNow()}
    </PostsItem2MetaInfo>
  </LWTooltip>
}

const PostsItemDateComponent = registerComponent("PostsItemDate", PostsItemDate, {styles});

declare global {
  interface ComponentTypes {
    PostsItemDate: typeof PostsItemDateComponent
  }
}

