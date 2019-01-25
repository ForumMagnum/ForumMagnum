import { Components, getRawComponent, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { commentBodyStyles, postHighlightStyles } from '../../../themes/stylePiping'
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { commentExcerptFromHTML } from '../../../lib/editor/ellipsize'

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
    }
  },
  root: {
    position: "relative",
    '& .read-more': {
      position: "relative",
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
    },
    '& .read-more-f-tooltip': {
      display: "none",
      position: "absolute",
      background: "rgba(0,0,0,.6)",
      color: "white",
      padding: "7px 10px",
      width:156,
      borderRadius: 5,
      top: -60,
      left:0,
    },
    '& .read-more:hover .read-more-f-tooltip': {
      display: "inline-block"
    }
  },
  retracted: {
    textDecoration: "line-through",
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
    const { html } = comment.content || {}

    const bodyClasses = classNames(
      { [classes.commentStyling]: !comment.answer,
        [classes.answerStyling]: comment.answer,
        [classes.retracted]: comment.retracted }
    );

    if (comment.deleted) {
      return <CommentDeletedMetadata documentId={comment._id}/>
    } else if (this.shouldRenderExcerpt()) {
      return (
        <div className={classes.root}>
          <ContentItemBody className={bodyClasses}
            dangerouslySetInnerHTML={{__html: commentExcerptFromHTML(html, truncationCharCount)}}/>
        </div>
      )
    } else if (!collapsed) {
      return <ContentItemBody className={bodyClasses}
        dangerouslySetInnerHTML={{__html: html}}/>
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
