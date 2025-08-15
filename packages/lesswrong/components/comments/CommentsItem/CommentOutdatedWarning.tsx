import React from 'react';
import { extractVersionsFromSemver } from '../../../lib/editor/utils';
import HistoryIcon from '@/lib/vendor/@material-ui/icons/src/History';
import { QueryLink } from '../../../lib/reactRouterWrapper';
import LWTooltip from "../../common/LWTooltip";
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("CommentOutdatedWarning", (theme: ThemeType) => ({
  outdatedWarning: {
    float: "right",
    position: 'relative',
    [theme.breakpoints.down('xs')]: {
      float: "none",
      display: 'block'
    }
  },
  icon: {
    fontSize: 'inherit',
    position: 'relative',
    top: 2
  }
}))

interface PostWithVersion {
  contents: {
    version: string
  }
}

function postHadMajorRevision(comment: CommentsList, post: PostsMinimumInfo|PostWithVersion) {
  if (!comment?.postVersion || !(post as PostWithVersion)?.contents?.version) {
    return false
  }
  const { major: origMajorPostVer } = extractVersionsFromSemver(comment.postVersion)
  const { major: currentMajorPostVer } = extractVersionsFromSemver((post as PostWithVersion).contents.version)

  if (origMajorPostVer === 0) {
    return currentMajorPostVer > 1;
  } else {
    return origMajorPostVer < currentMajorPostVer
  }
}

const CommentOutdatedWarning = ({comment, post}: {
  comment: CommentsList,
  post: PostsMinimumInfo,
}) => {
  if (!postHadMajorRevision(comment, post))
    return null;
  return <CommentOutdatedWarningIcon comment={comment}/>
};

const CommentOutdatedWarningIcon = ({comment}: {
  comment: CommentsList,
}) => {
  const classes = useStyles(styles);
  return <span className={classes.outdatedWarning}>
    <LWTooltip title="The top-level post had major updates since this comment was created. Click to see post at time of creation.">
      <QueryLink query={{revision: comment.postVersion}} merge><HistoryIcon className={classes.icon}/> Response to previous version </QueryLink>
    </LWTooltip>
  </span>;
}

export default CommentOutdatedWarning;
