import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { ExpandedDate } from '../common/FormatDate';
import moment from '../../lib/moment-timezone';
import { isEAForum } from '../../lib/instanceSettings';

export const POSTED_AT_WIDTH = 38
export const START_TIME_WIDTH = 72

const customStyles = (theme: ThemeType) => isEAForum
  ? {}
  : {
    fontWeight: 300,
    color: theme.palette.text.slightlyIntense2,
  };

const styles = (theme: ThemeType): JssStyles => ({
  postedAt: {
    ...(isEAForum && {display: "flex"}),
    '&&': {
      cursor: "pointer",
      width: POSTED_AT_WIDTH,
      fontSize: "1rem",
      ...customStyles(theme),
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
      ...customStyles(theme),
      [theme.breakpoints.down('xs')]: {
        width: "auto",
      }
    }
  },
  tooltipSmallText: {
    ...theme.typography.tinyText,
    ...theme.typography.italic,
  },
  xsHide: {
    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
  },
});

const PostsItemDate = ({post, noStyles, includeAgo, classes}: {
  post: PostsBase,
  noStyles?: boolean,
  includeAgo?: boolean,
  classes: ClassesType,
}) => {
  if (noStyles) {
    classes = {
      tooltipSmallText: classes.tooltipSmallText,
      xsHide: classes.xsHide,
    };
  }

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

  const ago = includeAgo ? <span className={classes.xsHide}>&nbsp;ago</span> : null;

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
        {ago}
      </PostsItem2MetaInfo>
    </LWTooltip>
  }

  return <LWTooltip
    placement="right"
    title={<ExpandedDate date={post.postedAt}/>}
  >
    <PostsItem2MetaInfo className={classes.postedAt}>
      {moment(new Date(post.postedAt)).fromNow()}
      {ago}
    </PostsItem2MetaInfo>
  </LWTooltip>
}

const PostsItemDateComponent = registerComponent("PostsItemDate", PostsItemDate, {styles});

declare global {
  interface ComponentTypes {
    PostsItemDate: typeof PostsItemDateComponent
  }
}

