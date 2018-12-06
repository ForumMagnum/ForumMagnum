import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles'
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
// import LinkIcon from '@material-ui/icons/Link';
// import { Posts } from '../../lib/collections/posts';
// import { Link } from 'react-router';
import { Comments } from '../../lib/collections/comments';

const styles = theme => ({
  root: {
    marginTop: 10,
  },
  menuIcon: {
    cursor: "pointer",
    color: theme.palette.grey[400]
  },
  permalink: {
    [theme.breakpoints.up("md")]: {
    marginTop: theme.spacing.unit,
      display: "block"
    },
    color: theme.palette.grey[500]
  },
})

const AnswerMeta = ({classes, comment, post, showEdit, scrollIntoView}) => {
  const { CommentsMenu } = Components

  return <div className={classes.root}>
    {/*<Link
      className={classes.permalink}
      onClick={scrollIntoView}
      to={Posts.getPageUrl(post) + "#" + comment._id}
    >
      <LinkIcon />
    </Link>*/}

  </div>
};

AnswerMeta.propTypes = {
  classes: PropTypes.object.isRequired,
  post: PropTypes.object.isRequired,
  comment: PropTypes.object.isRequired,
  showEdit: PropTypes.func,
};

registerComponent('AnswerMeta', AnswerMeta, withStyles(styles, {name: "AnswerMeta"}));
