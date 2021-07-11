import React, { useEffect } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useQuery, gql } from '@apollo/client';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments';
import withErrorBoundary from '../common/withErrorBoundary'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 6
  },
});

const TagEditsTimeBlock = ({before, after, reportEmpty, classes}: {
  before: string,
  after: string,
  reportEmpty: ()=>void,
  classes: ClassesType
}) => {
  const { ContentType, SingleLineTagUpdates } = Components;
  const { data, loading } = useQuery(gql`
    query getTagUpdates($before: Date!, $after: Date!) {
      TagUpdatesInTimeBlock(before: $before, after: $after) {
        tag {
          ...TagBasicInfo
        }
        revisionIds
        commentCount
        commentIds
        lastRevisedAt
        lastCommentedAt
        added
        removed
      }
    }
    ${fragmentTextForQuery('TagBasicInfo')}
  `, {
    variables: {
      before, after,
    },
    ssr: true,
  });
  
  useEffect(() => {
    if (!loading && !data?.TagUpdatesInTimeBlock?.length) {
      reportEmpty();
    }
  }, [loading, data, reportEmpty]);
  
  if (!data?.TagUpdatesInTimeBlock?.length)
    return null;
  return <div className={classes.root}>
    <div className={classes.subtitle}>
      <ContentType type="tags" label="Wiki/Tag Page Edits and Discussion"/>
    </div>
    {data.TagUpdatesInTimeBlock.map(tagUpdates => <SingleLineTagUpdates
      key={tagUpdates.tag._id}
      tag={tagUpdates.tag}
      revisionIds={tagUpdates.revisionIds}
      commentIds={tagUpdates.commentIds}
      commentCount={tagUpdates.commentCount}
      changeMetrics={{added: tagUpdates.added, removed: tagUpdates.removed}}
    />)}
  </div>
}

const TagEditsTimeBlockComponent = registerComponent('TagEditsTimeBlock', TagEditsTimeBlock, {
  styles, hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    TagEditsTimeBlock: typeof TagEditsTimeBlockComponent
  }
}
