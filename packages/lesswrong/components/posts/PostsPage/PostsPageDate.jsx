import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import { ExpandedDate } from '../../common/FormatDate.jsx';
import classNames from 'classnames';

const styles = theme => ({
  date: {
    marginLeft: 20,
    display: 'inline-block',
    color: theme.palette.grey[600],
    fontSize: theme.typography.body1.fontSize,
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
  
  const tooltip = (<div>
    <div>Posted on <ExpandedDate date={post.postedAt}/></div>
    
    {post.curatedDate && <div>
      Curated on <ExpandedDate date={post.curatedDate}/>
    </div>}
  </div>);

  if (hasMajorRevision) {
    return (
      <span>
        <span className={classNames(classes.date, classes.mobileDate)}>
          <PostsRevisionSelector post={post}/>
        </span>
        <span className={classNames(classes.date, classes.desktopDate)}>
          <PostsRevisionSelector format="Do MMM YYYY" post={post}/>
        </span>
      </span>
    )
  }
  
  return (<React.Fragment>
    <Tooltip title={tooltip} placement="bottom">
      <span>
        <span className={classNames(classes.date, classes.mobileDate)}>
          <FormatDate date={post.postedAt} tooltip={false} />
        </span>
        <span className={classNames(classes.date, classes.desktopDate)}>
          <FormatDate date={post.postedAt} format="Do MMM YYYY" tooltip={false} />
        </span>
      </span>
    </Tooltip>
  </React.Fragment>);
}

registerComponent("PostsPageDate", PostsPageDate,
  withStyles(styles, {name: "PostsPageDate"}));
