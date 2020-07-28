import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import { useMulti } from '../../lib/crud/withMulti';
import withErrorBoundary from '../common/withErrorBoundary';
import LinearProgress from '@material-ui/core/LinearProgress';

const styles = theme => ({
  root: {
    background: "white",
    padding: 10,
    paddingLeft: 16,
    paddingRight: 16,
    fontSize: "1.3rem",
    ...theme.typography.postStyle
  }
});

const TagProgressBar = ({classes}: {
  classes: ClassesType,
}) => {

  const { LWTooltip } = Components;

  const { totalCount: taggedTotal } = useMulti({
    terms: {
      view: "tagProgressTagged"
    },
    collection: Posts,
    fragmentName: 'PostsBase',
    enableTotal: true,
    fetchPolicy: 'cache-and-network',
    ssr: true
  });

  const { totalCount: postsTotal } = useMulti({
    terms: {
      view: "tagProgressPosts"
    },
    collection: Posts,
    fragmentName: 'PostsBase',
    enableTotal: true,
    fetchPolicy: 'cache-and-network',
    ssr: true
  });

  if (!taggedTotal || !postsTotal) return null

  return <div className={classes.root}>
    <LWTooltip title={`Help tag our top posts. Currently, ${taggedTotal} out of ${postsTotal} have been tagged.`}>
      <div>
        Tagging Progress
        <LinearProgress variant="buffer" value={(taggedTotal/postsTotal)*100} />
      </div>
    </LWTooltip>
  </div>
}

const TagProgressBarComponent = registerComponent("TagProgressBar", TagProgressBar, {styles, hocs:[withErrorBoundary]});

declare global {
  interface ComponentTypes {
    TagProgressBar: typeof TagProgressBarComponent
  }
}

