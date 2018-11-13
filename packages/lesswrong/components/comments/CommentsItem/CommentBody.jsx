import { Components, getRawComponent, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { commentBodyStyles } from '../../../themes/stylePiping'
import PropTypes from 'prop-types';
import Tooltip from '@material-ui/core/Tooltip'
import { excerptFromHTML } from '../../../lib/editor/ellipsize'

const styles = theme => ({
  commentStyling: {
    ...commentBodyStyles(theme),
    maxWidth: "100%",
    overflowX: "auto",
    overflowY: "hidden",
  }
})

class CommentBody extends Component {
  state = { expanded: false }

  shouldRenderExcerpt = () => {
    const { truncated, comment, collapsed } = this.props
    const { expanded } = this.state
    return truncated && comment.body.length > 300 && !expanded && !collapsed
  }

  render () {
    const { comment, classes } = this.props
    const { ContentItemBody, CommentDeletedMetadata } = Components

    if (comment.deleted) {
      return <CommentDeletedMetadata documentId={comment._id}/>
    } else if (this.shouldRenderExcerpt()) {
      return (
        <Tooltip
          placement="right"
          title={<div>Click to expand comment.<br/>Doubleclick to expand thread</div>}
          enterDelay={1000}>
          <div onClick={() => this.setState({expanded: true})}>
            <ContentItemBody className={classes.commentStyling} dangerouslySetInnerHTML={{__html: excerptFromHTML(comment.htmlBody)}}/>
          </div>
        </Tooltip>
      )
    } else {
      return <ContentItemBody className={classes.commentStyling} dangerouslySetInnerHTML={{__html: comment.htmlBody}}/>
    }
  }
}

CommentBody.propTypes = {
  comment: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired
};


registerComponent('CommentBody', CommentBody, withStyles(styles, {name: "CommentBody"}));
