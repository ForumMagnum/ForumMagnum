import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles'
import { withRouter, Link } from '../../../lib/reactRouterWrapper.js';
import Icon from '@material-ui/core/Icon';
import { Posts } from "../../../lib/collections/posts";
import classNames from 'classnames';

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
    fontSize: "0.9rem !important",
    transform: "rotate(-45deg)",
    verticalAlign: "middle",
    color: "rgba(0,0,0,0.5) !important",
    margin: "0 3px",
    paddingBottom: 2,
  },
});

const CommentsItemDate = ({comment, post, router, showPostTitle, scrollOnClick=false, scrollIntoView, classes }) => {
  const handleLinkClick = (event) => {
    event.preventDefault()
    router.replace({...router.location, hash: "#" + comment._id})
    scrollIntoView(event);
  };
  
  return (
    <div className={classNames(classes.root, {
      [classes.date]: !comment.answer,
      [classes.answerDate]: comment.answer,
    })}>
      { !scrollOnClick ?
        <Link to={Posts.getPageUrl(post) + "#" + comment._id}>
          <Components.FormatDate date={comment.postedAt} format={comment.answer && "MMM DD, YYYY"}/>
          <Icon className={classNames("material-icons", classes.icon)}> link </Icon>
          {showPostTitle && post.title && <span className={classes.postTitle}> { post.title }</span>}
        </Link>
      :
      <a href={Posts.getPageUrl(post) + "#" + comment._id} onClick={handleLinkClick}>
        <Components.FormatDate date={comment.postedAt}/>
        <Icon className={classNames("material-icons", classes.icon)}> link </Icon>
        {showPostTitle && post.title && <span className={classes.postTitle}> { post.title }</span>}
      </a>
      }
    </div>
  );
}

registerComponent('CommentsItemDate', CommentsItemDate,
  withRouter,
  withStyles(styles, {name: "CommentsItemDate"}));