import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import classnames from 'classnames';
import { Link } from '../../lib/reactRouterWrapper.js';
import { withStyles } from '@material-ui/core/styles';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';
import { Posts } from '../../lib/collections/posts/collection.js';

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

  login: {
    position: "relative", // TODO: figure out more elegant way of doing this without weird CSS rituals
    top: theme.spacing.unit
  }
});

const BottomNavigationItem = ({direction, post, sequence, classes}) => {
  const { LoginPopupButton } = Components
  const commentCount = post.commentCount || "No"
  
  return (
    <span>
      <Link to={Posts.getPageUrl(post, false, sequence?._id)}>
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
      {direction==="Next" && <span className={classes.login}>
        <LoginPopupButton title="LessWrong keeps track of what posts logged in users have read, so you can keep reading wherever you've left off">
            Log in to save where you left off
        </LoginPopupButton>
      </span>}
    </span>
  )
};

registerComponent('BottomNavigationItem', BottomNavigationItem,
  withStyles(styles, {name: "BottomNavigationItem"}));
