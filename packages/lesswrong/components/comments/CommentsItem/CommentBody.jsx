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
  render () {
    const { comment, currentUser, classes, collapsed, truncated, postPage } = this.props
    const { ContentItemBody, CommentDeletedMetadata } = Components
    const { html = "" } = comment.contents || {}

    const bodyClasses = classNames(
      { [classes.commentStyling]: !comment.answer,
        [classes.answerStyling]: comment.answer,
        [classes.retracted]: comment.retracted }
    );

    if (comment.deleted) { return <CommentDeletedMetadata documentId={comment._id}/> }
    if (collapsed) { return null }

    const innerHtml = truncated ? commentExcerptFromHTML(comment, currentUser, postPage) : html
  
    return (
      <div className={classes.root}>
        <ContentItemBody className={bodyClasses} dangerouslySetInnerHTML={{__html: innerHtml }}/>
      </div>
    )
  }
}

CommentBody.propTypes = {
  comment: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};


registerComponent('CommentBody', CommentBody, withUser, withStyles(styles, {name: "CommentBody"}));
