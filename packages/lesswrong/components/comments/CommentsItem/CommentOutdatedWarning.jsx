import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { extractVersionsFromSemver } from '../../../lib/editor/utils';
import HistoryIcon from '@material-ui/icons/History';
import { withStyles } from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import { Link } from 'react-router';

const styles = theme => ({
  icon: {
    fontSize: 'inherit',
    position: 'relative',
    top: 2
  }
})

function postHadMajorRevision(comment, post) {
  if (!comment || !comment.postVersion || !post || !post.contents || !post.contents.version) {
    return false
  }
  const { major: origMajorPostVer } = extractVersionsFromSemver(comment.postVersion)
  const { major: currentMajorPostVer } = extractVersionsFromSemver(post.contents.version)
  return origMajorPostVer < currentMajorPostVer
}

const CommentOutdatedWarning = ({comment, post, classes}) => {
  return postHadMajorRevision(comment, post) && 
    <Tooltip title="The top-level post had major updates since this comment was created. Click to see post at time of creation.">
      <Link to={loc=> ({...loc, query: {...loc.query, revision: comment.postVersion}})}><HistoryIcon className={classes.icon}/> Response to previous version </Link>
    </Tooltip>  
};

registerComponent('CommentOutdatedWarning', CommentOutdatedWarning, withStyles(styles, { name: "CommentOutdatedWarning" }));
