import { registerComponent } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import IconButton from '@material-ui/core/IconButton'
import Tooltip from '@material-ui/core/Tooltip';
import NavigateBefore from '@material-ui/icons/NavigateBefore'
import NavigateNext from '@material-ui/icons/NavigateNext'
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper.js';
import { withStyles } from '@material-ui/core/styles';
import classnames from 'classnames';

// Shared with SequencesNavigationLinkDisabled
export const styles = theme => ({
  root: {
    padding: 0,
    margin: 12,
  },
  normal: {
    "& svg": {
      color: "rgba(0,0,0, 0.5) !important"
    }
  },
  disabled: {
    "& svg": {
      color: "rgba(0,0,0, 0.2) !important"
    }
  },
});

const SequencesNavigationLink = ({ post, direction, classes }) => {
  const icon = (
    <IconButton classes={{root: classnames(classes.root, {
      [classes.disabled]: !post,
      [classes.normal]: !!post,
    })}}>
      { (direction === "left") ? <NavigateBefore/> : <NavigateNext/> }
    </IconButton>
  );
  
  if (post) {
    const button = (
      <Link to={Posts.getPageUrl(post, false, post.sequence?._id)}>
        {icon}
      </Link>
    )
    if (post.title) {
      return <Tooltip title={post.title}>{button}</Tooltip>
    } else {
      return button;
    }
  } else {
    return icon;
  }
};

registerComponent('SequencesNavigationLink', SequencesNavigationLink,
  withStyles(styles, {name: "SequencesNavigationLink"}));
