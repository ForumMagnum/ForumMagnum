import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { createStyles } from '@material-ui/core/styles';
import { ExpandedDate } from '../common/FormatDate';
import withHover from '../common/withHover';
import moment from '../../lib/moment-timezone';

export const POSTED_AT_WIDTH = 38
export const START_TIME_WIDTH = 72

const styles = createStyles(theme => ({
  postedAt: {
    '&&': {
      cursor: "pointer",
      width: POSTED_AT_WIDTH,
      fontWeight: 300,
      fontSize: "1rem",
      color: "rgba(0,0,0,.9)",
      [theme.breakpoints.down('sm')]: {
        width: "auto",
      }
    }
  },
  startTime: {
    '&&': {
      cursor: "pointer",
      width: START_TIME_WIDTH,
      fontWeight: 300,
      fontSize: "1rem",
      color: "rgba(0,0,0,.9)",
      [theme.breakpoints.down('sm')]: {
        width: "auto",
      }
    }
  },
}));

const PostsItemDate = ({post, classes, hover, anchorEl, stopHover}) => {
  const { PostsItem2MetaInfo, FormatDate, LWPopper } = Components;

  if (post.isEvent && post.startTime) {
    return <PostsItem2MetaInfo className={classes.startTime}>
      <LWPopper open={hover} anchorEl={anchorEl} onMouseEnter={stopHover} tooltip placement="top">
        <span>Event starts at <Components.EventTime post={post} /></span>
      </LWPopper>
      <FormatDate date={post.startTime} format={"MMM Do"} tooltip={false}/>
    </PostsItem2MetaInfo>
  }

  if (post.isEvent && !post.startTime) {
    return <PostsItem2MetaInfo className={classes.startTime}>
      <LWPopper open={hover} anchorEl={anchorEl} onMouseEnter={stopHover} tooltip placement="top">
        <span>To Be Determined</span>
      </LWPopper>
      <span>TBD</span>
    </PostsItem2MetaInfo>
  }

  if (post.curatedDate) {
    return <PostsItem2MetaInfo className={classes.postedAt}>
      <LWPopper open={hover} anchorEl={anchorEl} onMouseEnter={stopHover} tooltip placement="top">
        <div>
          <div>Curated on <ExpandedDate date={post.curatedDate}/></div>
          <div>Posted on <ExpandedDate date={post.postedAt}/></div>
        </div>
      </LWPopper>
      <span>{moment(new Date(post.curatedDate)).fromNow()}</span>
    </PostsItem2MetaInfo>
  }

  return <PostsItem2MetaInfo className={classes.postedAt}>
      <LWPopper open={hover} anchorEl={anchorEl} onMouseEnter={stopHover} tooltip placement="top">
        <ExpandedDate date={post.postedAt}/>
      </LWPopper>
      <span>{moment(new Date(post.postedAt)).fromNow()}</span>
    </PostsItem2MetaInfo>
}

const PostsItemDateComponent = registerComponent("PostsItemDate", PostsItemDate, {
  styles,
  hocs: [withHover()]
});

declare global {
  interface ComponentTypes {
    PostsItemDate: typeof PostsItemDateComponent
  }
}

