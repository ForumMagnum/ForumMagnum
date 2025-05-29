import { registerComponent } from '../../../lib/vulcan-lib/components';
import React from 'react';
import { extractVersionsFromSemver } from '../../../lib/editor/utils';
import HistoryIcon from '@/lib/vendor/@material-ui/icons/src/History';
import { QueryLink } from '../../../lib/reactRouterWrapper';
import LWTooltip from "../../common/LWTooltip";

const styles = (theme: ThemeType) => ({
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
})

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

const CommentOutdatedWarning = ({comment, post, classes}: {
  comment: CommentsList,
  post: PostsMinimumInfo,
  classes: ClassesType<typeof styles>,
}) => {
  if (!postHadMajorRevision(comment, post))
    return null;
  return <span className={classes.outdatedWarning}>
    <LWTooltip title="The top-level post had major updates since this comment was created. Click to see post at time of creation.">
      <QueryLink query={{revision: comment.postVersion}} merge><HistoryIcon className={classes.icon}/> Response to previous version </QueryLink>
    </LWTooltip>
  </span>;
};

export default registerComponent(
  'CommentOutdatedWarning', CommentOutdatedWarning, {styles}
);



