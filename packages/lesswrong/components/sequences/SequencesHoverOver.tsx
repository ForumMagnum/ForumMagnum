import React, { useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Card from '@material-ui/core/Card';
import { useSingle } from '../../lib/crud/withSingle';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 16,
    width: 450
  },
  title: {
    ...theme.typography.body1,
    ...theme.typography.postStyle,
    fontVariant: "small-caps",
  },
  description: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    paddingTop: 8,
    paddingBottom: 8,
  }
});

export const SequencesHoverOver = ({classes, sequenceId}: {
  classes: ClassesType,
  sequenceId: string,
}) => {
  const { SequencesSmallPostLink, Loading, ContentStyles, ContentItemTruncated } = Components

  const { document: sequence, loading } = useSingle({
    documentId: sequenceId,
    collectionName: "Sequences",
    fragmentName: 'SequenceHoverOver',
  })
  
  return <Card className={classes.root}>
    {!sequence && loading && <Loading />}

    <div className={classes.title}>{sequence?.title}</div>
    <ContentStyles contentType="postHighlight" className={classes.description}>
      <ContentItemTruncated
        maxLengthWords={100}
        graceWords={20}
        rawWordCount={sequence?.contents?.wordCount || 0}
        expanded={false}
        getTruncatedSuffix={() => null}
        dangerouslySetInnerHTML={{__html: sequence?.contents?.htmlHighlight || ""}}
        description={`sequence ${sequence?._id}`}
      />
    </ContentStyles>
    {sequence?.chapters?.map((chapter) => <span key={chapter._id}>
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

