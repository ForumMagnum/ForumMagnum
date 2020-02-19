import { registerComponent } from '../../../lib/vulcan-lib';
import React from 'react';
import { extractVersionsFromSemver } from '../../../lib/editor/utils';
import HistoryIcon from '@material-ui/icons/History';
import Tooltip from '@material-ui/core/Tooltip';
import { QueryLink } from '../../../lib/reactRouterWrapper';

const styles = theme => ({
  icon: {
    fontSize: 'inherit',
    position: 'relative',
    top: 2
  }
})

interface PostWithVersion {
  contents: {
    version: string
  }
}

function postHadMajorRevision(comment: CommentsList, post: PostWithVersion) {
  if (!comment || !comment.postVersion || !post || !post.contents || !post.contents.version) {
    return false
  }
  const { major: origMajorPostVer } = extractVersionsFromSemver(comment.postVersion)
  const { major: currentMajorPostVer } = extractVersionsFromSemver(post.contents.version)
  return origMajorPostVer < currentMajorPostVer
}

const CommentOutdatedWarning = ({comment, post, classes}: {
  comment: CommentsList,
  post: PostWithVersion,
  classes: ClassesType,
}) => {
  if (!postHadMajorRevision(comment, post))
    return null;
  return (
    <Tooltip title="The top-level post had major updates since this comment was created. Click to see post at time of creation.">
      <QueryLink query={{revision: comment.postVersion}} merge><HistoryIcon className={classes.icon}/> Response to previous version </QueryLink>
    </Tooltip>
  );
};

const CommentOutdatedWarningComponent = registerComponent(
  'CommentOutdatedWarning', CommentOutdatedWarning, {styles}
);

declare global {
  interface ComponentTypes {
    CommentOutdatedWarning: typeof CommentOutdatedWarningComponent,
  }
}

