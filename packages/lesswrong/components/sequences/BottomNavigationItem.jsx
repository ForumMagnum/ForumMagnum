import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import classnames from 'classnames';
import { Link } from 'react-router';
import { withStyles } from '@material-ui/core/styles';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';

const styles = theme => ({
  root: {
    paddingTop: 28,
    
    [legacyBreakpoints.maxSmall]: {
      width: "100%",
    },
    
    "&:hover, &:visited, &:focus": {
      color: "rgba(0,0,0, 0.5)",
    },
  },
  
  direction: {
    fontSize: "1.2rem",
    marginBottom: ".5em",
    fontWeight: 600,
  },
  
  postTitle: {
    fontSize: "1.4rem",
    marginBottom: ".5em",
    marginTop: 0,
    fontWeight: 500,
    
    // text-overflow: ellipsis;
    // overflow: hidden;
    // white-space: pre;
  },
  
  previous: {
    textAlign: "right",

    [legacyBreakpoints.maxSmall]: {
      textAlign: "left",
    }
  },
  
  meta: {
    color: "rgba(0,0,0,.5)",
    fontSize: 12,
  },
  
  metaEntry: {
    paddingRight: 10,
  },
});

const BottomNavigationItem = ({direction, post, sequence, classes}) => {
  const commentCount = post.commentCount || "No"

  return (
    <Link to={`/s/${sequence._id}/p/${post._id}`}>
      <div className={classnames(
        classes.root,
        { [classes.previous]: direction==="Previous" }
      )}>
        <div className={classes.direction}>{direction}:</div>
        <div className={classes.postTitle}>{post.title}</div>
        <div className={classes.meta}>
          <span className={classes.metaEntry}>{commentCount} comments</span>
          <span className={classes.metaEntry}>{post.baseScore} points</span>
        </div>
      </div>
    </Link>
  )
};


registerComponent('BottomNavigationItem', BottomNavigationItem,
  withStyles(styles, {name: "BottomNavigationItem"}));
