import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

const styles = theme => ({
  date: {
    marginLeft: 20,
    display: 'inline-block',
    color: theme.palette.grey[600],
    fontSize: theme.typography.body2.fontSize,
  },
  mobileDate: {
    [theme.breakpoints.up('md')]: {
      display:"none"
    }
  },
  desktopDate: {
    whiteSpace: "no-wrap",
    [theme.breakpoints.down('sm')]: {
      display:"none"
    }
  },
});

const PostsPageDate = ({ post, hasMajorRevision, classes }) => {
  const { FormatDate, PostsRevisionSelector } = Components;
  
  return (<React.Fragment>
    {<span className={classNames(classes.date, classes.mobileDate)}>
      <FormatDate date={post.postedAt}/>
    </span>}
    {<span className={classNames(classes.date, classes.desktopDate)}>
      {hasMajorRevision ? <PostsRevisionSelector post={post}/> : <FormatDate date={post.postedAt} format="Do MMM YYYY"/>}
    </span>}
  </React.Fragment>);
}

registerComponent("PostsPageDate", PostsPageDate,
  withStyles(styles, {name: "PostsPageDate"}));
