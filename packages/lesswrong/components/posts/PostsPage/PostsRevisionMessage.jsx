import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router';
import grey from '@material-ui/core/colors/grey';
import PropTypes from 'prop-types';

const styles = theme => ({
  root: {
    color: grey[600],
    marginBottom: theme.spacing.unit*2,
    fontSize:".9em",
    maxWidth: "100%",
    overflowX: "hidden",
    textOverflow: "ellipsis",
    ...theme.typography.postStyle,
  },
})

const PostsRevisionMessage = ({post, classes}) => {
  if (!post.contents)
    return null;

  const { FormatDate } = Components
  return (
    <div className={classes.root}>
      You are viewing a version of this post published on the <FormatDate date={post.contents.editedAt} format="Do MMM YYYY"/>. 
      Click <Link to={loc => ({...loc, query: {...loc.query, revision: undefined}})}>here</Link> to see the most recent version of this post.
    </div>
  );
}

PostsRevisionMessage.propTypes = {
  post: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};

registerComponent('PostsRevisionMessage', PostsRevisionMessage, withStyles(styles, {name:"PostsRevisionMessage"}));
