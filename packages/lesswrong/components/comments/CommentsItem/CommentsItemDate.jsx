import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles'
import { Link } from '../../../lib/reactRouterWrapper.js';
import LinkIcon from '@material-ui/icons/Link';
import { Comments } from "../../../lib/collections/comments";
import classNames from 'classnames';
import { useNavigation, useLocation } from '../../../lib/routeUtil';

const styles = theme => ({
  root: {
    "& a:hover, & a:active": {
      "& $icon": {
        color: "rgba(0,0,0,0.3) !important",
      },
    },
  },
  answerDate: {},
  date: {
    color: "rgba(0,0,0,0.5)",
  },
  postTitle: {
    marginRight: 5,
  },
  link: {
  },
  icon: {
    fontSize: "0.9rem",
    transform: "rotate(-45deg)",
    verticalAlign: "middle",
    color: "rgba(0,0,0,0.5)",
    margin: "0 2px",
    position: "relative",
    top: -2
  },
});

const CommentsItemDate = ({comment, post, showPostTitle, classes, scrollOnClick, scrollIntoView }) => {
  const { history } = useNavigation();
  const { location } = useLocation();

   const handleLinkClick = (event) => {
    event.preventDefault()
    history.replace({...location, hash: "#" + comment._id})
    scrollIntoView();
  };

  const url = Comments.getPageUrlFromIds({postId: post._id, postSlug: post.slug, commentId: comment._id, permalink: false})

  const date = <span>
    <Components.FormatDate date={comment.postedAt} format={comment.answer && "MMM DD, YYYY"}/>
    <LinkIcon className={classes.icon}/>
    {showPostTitle && post.title && <span className={classes.postTitle}> {post.draft && "[Draft]"} {post.title}</span>}
  </span>

  return (
    <div className={classNames(classes.root, {
      [classes.date]: !comment.answer,
      [classes.answerDate]: comment.answer,
    })}>
      {scrollOnClick ? <a href={url} onClick={handleLinkClick}>{ date } </a>
        : <Link to={url}>{ date }</Link>
      }
    </div>
  );
}

registerComponent('CommentsItemDate', CommentsItemDate,
  withStyles(styles, {name: "CommentsItemDate"}));
