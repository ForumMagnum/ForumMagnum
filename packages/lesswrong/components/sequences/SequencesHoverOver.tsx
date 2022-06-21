import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Card from '@material-ui/core/Card';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 16
  }
});

export const SequencesHoverOver = ({classes, sequenceId}: {
  classes: ClassesType,
  sequenceId: string,
}) => {
  const { SequencesSmallPostLink, Loading } = Components

  const { results: chapters } = useMulti({
    terms: {
      view: "SequenceChapters",
      sequenceId: sequenceId,
      limit: 100
    },
    collectionName: "Chapters",
    fragmentName: 'ChaptersFragment',
    enableTotal: false,
  });

  return <Card className={classes.root}>
    {chapters?.map((chapter) => <span key={chapter._id}>
        {!chapters && <Loading />}
        {chapter.posts?.map(post => <SequencesSmallPostLink 
                                      key={chapter._id + post._id} 
                                      post={post}
                                    />
        )}
      </span>
    )}
  </Card>;
}

const SequencesHoverOverComponent = registerComponent('SequencesHoverOver', SequencesHoverOver, {styles});

declare global {
  interface ComponentTypes {
    SequencesHoverOver: typeof SequencesHoverOverComponent
  }
}

