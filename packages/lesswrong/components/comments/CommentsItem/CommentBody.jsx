import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { commentBodyStyles, postHighlightStyles } from '../../../themes/stylePiping'
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { commentExcerptFromHTML } from '../../../lib/editor/ellipsize'
import withUser from '../../common/withUser'

const styles = theme => ({
  commentStyling: {
    ...commentBodyStyles(theme),
    maxWidth: "100%",
    overflowX: "auto",
    overflowY: "hidden",
  },
  answerStyling: {
    ...postHighlightStyles(theme),
    maxWidth: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    '& .read-more a, & .read-more a:hover': {
      textShadow:"none",
      backgroundImage: "none"
    },
    marginBottom: ".5em"
  },
  root: {
    position: "relative",
    '& .read-more': {
      fontSize: ".85em",
      color: theme.palette.grey[600]
    }
  },
  retracted: {
    textDecoration: "line-through",
  }
})

class CommentBody extends Component {
  render () {
    const { comment, currentUser, classes, collapsed, truncated, postPage, showTruncatedMessage=true } = this.props
    const { ContentItemBody, CommentDeletedMetadata } = Components
    const { html = "" } = comment.contents || {}

    const bodyClasses = classNames(
      { [classes.commentStyling]: !comment.answer,
        [classes.answerStyling]: comment.answer,
        [classes.retracted]: comment.retracted }
    );

    if (comment.deleted) { return <CommentDeletedMetadata documentId={comment._id}/> }
    if (collapsed) { return null }

    const innerHtml = truncated ? commentExcerptFromHTML(comment, currentUser, postPage, showTruncatedMessage) : html
  
    return (
      <div className={classes.root}>
        <ContentItemBody
          className={bodyClasses}
          dangerouslySetInnerHTML={{__html: innerHtml }}
          description={`comment ${comment._id}`}
        />
      </div>
    )
  }
}

CommentBody.propTypes = {
  comment: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};


registerComponent('CommentBody', CommentBody, withUser, withStyles(styles, {name: "CommentBody"}));
