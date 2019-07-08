import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles'
import { withRouter, Link } from '../../../lib/reactRouterWrapper.js';
import Icon from '@material-ui/core/Icon';
import { Posts } from "../../../lib/collections/posts";

const styles = theme => ({
  answerDate: {},
  date: {
    color: "rgba(0,0,0,0.5)",
  },
  postTitle: {
    marginRight: 5,
  },
});

const CommentsItemDate = ({comment, post, router, showPostTitle, scrollOnClick=false, scrollIntoView, classes }) => {
  const handleLinkClick = (event) => {
    event.preventDefault()
    router.replace({...router.location, hash: "#" + comment._id})
    scrollIntoView(event);
  };
  
  return (
    <div className={comment.answer ? classes.answerDate : classes.date}>
      { !scrollOnClick ?
        <Link to={Posts.getPageUrl(post) + "#" + comment._id}>
          <Components.FormatDate date={comment.postedAt} format={comment.answer && "MMM DD, YYYY"}/>
          <Icon className="material-icons comments-item-permalink"> link </Icon>
          {showPostTitle && post.title && <span className={classes.postTitle}> { post.title }</span>}
        </Link>
      :
      <a href={Posts.getPageUrl(post) + "#" + comment._id} onClick={handleLinkClick}>
        <Components.FormatDate date={comment.postedAt}/>
        <Icon className="material-icons comments-item-permalink"> link </Icon>
        {showPostTitle && post.title && <span className={classes.postTitle}> { post.title }</span>}
      </a>
      }
    </div>
  );
}

registerComponent('CommentsItemDate', CommentsItemDate,
  withRouter,
  withStyles(styles, {name: "CommentsItemDate"}));