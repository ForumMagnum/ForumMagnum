import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { ExpandedDate } from '../common/FormatDate.jsx';
import Tooltip from '@material-ui/core/Tooltip';
import moment from 'moment-timezone';

export const POSTED_AT_WIDTH = 38
export const START_TIME_WIDTH = 72

const styles = theme => ({
  postedAt: {
    '&&': {
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
      width: START_TIME_WIDTH,
      fontWeight: 300,
      fontSize: "1rem",
      color: "rgba(0,0,0,.9)",
      [theme.breakpoints.down('sm')]: {
        width: "auto",
      }
    }
  },
});

const PostsItemDate = ({post, classes}) => {
  const { PostsItem2MetaInfo, EventTime, FormatDate } = Components;
  
  if (post.isEvent)
  {
    return (<PostsItem2MetaInfo className={classes.startTime}>
      {post.startTime
        ? <Tooltip title={<span>Event starts at <EventTime post={post} /></span>}>
            <FormatDate date={post.startTime} format={"MMM Do"}/>
          </Tooltip>
        : <Tooltip title={<span>To Be Determined</span>}>
            <span>TBD</span>
          </Tooltip>}
    </PostsItem2MetaInfo>);
  }
  else if (post.curatedDate)
  {
    return (<PostsItem2MetaInfo className={classes.postedAt}>
      <Tooltip title={<div>
        <div>Curated on <ExpandedDate date={post.curatedDate}/></div>
        <div>Posted on <ExpandedDate date={post.postedAt}/></div>
      </div>}>
        <span>{moment(new Date(post.curatedDate)).fromNow()}</span>
      </Tooltip>
    </PostsItem2MetaInfo>);
  }
  else
  {
    return (<PostsItem2MetaInfo className={classes.postedAt}>
      <Tooltip title={
        <ExpandedDate date={post.postedAt}/>
      }>
        <span>{moment(new Date(post.postedAt)).fromNow()}</span>
      </Tooltip>
    </PostsItem2MetaInfo>);
  }
}

registerComponent("PostsItemDate", PostsItemDate,
  withStyles(styles, {name: "PostsItemDate"}));
