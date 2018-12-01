import { Components, getRawComponent, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { commentBodyStyles } from '../../../themes/stylePiping'
import PropTypes from 'prop-types';
import { commentExcerptFromHTML } from '../../../lib/editor/ellipsize'

const styles = theme => ({
  commentStyling: {
    ...commentBodyStyles(theme),
    maxWidth: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    '& .read-more': {
      fontSize: ".85em",
    },
    '& .read-more-default': {
      display: "inline-block",
      minWidth: 125,
      color: "rgba(0,0,0,.4)",
    },
    '& .read-more-tooltip': {
      display:"none",
    },
    "&:hover .read-more-tooltip": {
      display:"inline-block"

    },
    '&:hover .read-more-default': {
      display:"none"
    }
  }
})

class CommentBody extends Component {

  shouldRenderExcerpt = () => {
    const { truncated, comment, collapsed, truncationCharCount } = this.props
    return truncated && comment.body && comment.body.length > truncationCharCount && !collapsed
  }

  render () {
    const { comment, classes, collapsed, truncationCharCount } = this.props
    const { ContentItemBody, CommentDeletedMetadata } = Components

    if (comment.deleted) {
      return <CommentDeletedMetadata documentId={comment._id}/>
    } else if (this.shouldRenderExcerpt()) {
      return (
        <div>
          <ContentItemBody className={classes.commentStyling} dangerouslySetInnerHTML={{__html: commentExcerptFromHTML(comment.htmlBody, truncationCharCount)}}/>
        </div>
      )
    } else if (!collapsed) {
      return <ContentItemBody className={classes.commentStyling} dangerouslySetInnerHTML={{__html: comment.htmlBody}}/>
    } else {
      return null
    }
  }
}

CommentBody.propTypes = {
  comment: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  truncationCharCount: PropTypes.number
};


registerComponent('CommentBody', CommentBody, withStyles(styles, {name: "CommentBody"}));
