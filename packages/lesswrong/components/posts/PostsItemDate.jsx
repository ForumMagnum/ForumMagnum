import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { ExpandedDate } from '../common/FormatDate.jsx';
import Tooltip from '@material-ui/core/Tooltip';
import moment from 'moment-timezone';

export const POSTED_AT_WIDTH = 38
export const START_TIME_WIDTH = 72

const styles = theme => ({
  startTime: {
    '&&': {
      width: START_TIME_WIDTH,
      justifyContent: "center",
      fontWeight: 300,
      fontSize: "1rem",
      color: "rgba(0,0,0,.9)",
      [theme.breakpoints.down('sm')]: {
        justifyContent: "flex-start",
        width: "none",
        flexGrow: 1,
      }
    }
  },
  postedAt: {
    '&&': {
      width: POSTED_AT_WIDTH,
      justifyContent: "center",
      fontWeight: 300,
      fontSize: "1rem",
      color: "rgba(0,0,0,.9)",
      [theme.breakpoints.down('sm')]: {
        justifyContent: "flex-start",
        width: "none",
        flexGrow: 1,
      }
    }
  },
});

const PostsItemDate = ({post, classes}) => {
  const { PostsItemMetaInfo, EventTime, FormatDate } = Components;
  
  if (post.isEvent)
  {
    return (<PostsItemMetaInfo className={classes.startTime}>
      {post.startTime
        ? <Tooltip title={<span>Event starts at <EventTime post={post} /></span>}>
            <FormatDate date={post.startTime} format={"MMM Do"}/>
          </Tooltip>
        : <Tooltip title={<span>To Be Determined</span>}>
            <span>TBD</span>
          </Tooltip>}
    </PostsItemMetaInfo>);
  }
  else if (post.curatedDate)
  {
    return (<PostsItemMetaInfo className={classes.postedAt}>
      <Tooltip title={<div>
        <div>Curated at <ExpandedDate date={post.curatedDate}/></div>
        <div>Posted at <ExpandedDate date={post.postedAt}/></div>
      </div>}>
        <span>{moment(new Date(post.curatedDate)).fromNow()}</span>
      </Tooltip>
    </PostsItemMetaInfo>);
  }
  else
  {
    return (<PostsItemMetaInfo className={classes.postedAt}>
      <Tooltip title={
        <ExpandedDate date={post.postedAt}/>
      }>
        <span>{moment(new Date(post.postedAt)).fromNow()}</span>
      </Tooltip>
    </PostsItemMetaInfo>);
  }
}

registerComponent("PostsItemDate", PostsItemDate,
  withStyles(styles, {name: "PostsItemDate"}));
