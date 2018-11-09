import { Components, getRawComponent, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { commentBodyStyles } from '../../../themes/stylePiping'
import PropTypes from 'prop-types';
import { excerptFromHTML } from '../../../lib/editor/ellipsize'
import Tooltip from '@material-ui/core/Tooltip'

const styles = theme => ({
  root: {
    cursor: "pointer",
    paddingBottom:theme.spacing.unit
  },
  commentStyling: {
    ...commentBodyStyles(theme),
    maxWidth: "100%",
    overflowX: "auto",
    overflowY: "hidden",
  }
})
const CommentExcerpt = ({htmlBody, classes, onReadMore}) => {
  if (!htmlBody)
    return null;

  return (
    <div className={classes.root} onClick={() => onReadMore()}>
      <Tooltip
        placement="right"
        title={<div>Click to expand comment.<br/>Doubleclick to expand thread</div>}
        enterDelay={1000}>
        <div
          className={classes.commentStyling}
          dangerouslySetInnerHTML={{__html: excerptFromHTML(htmlBody)}}
        />
      </Tooltip>
    </div>
  )
}

CommentExcerpt.propTypes = {
  htmlBody: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  onReadMore: PropTypes.object.isRequired
};


registerComponent('CommentExcerpt', CommentExcerpt, withStyles(styles, {name: "CommentExcerpt"}));
