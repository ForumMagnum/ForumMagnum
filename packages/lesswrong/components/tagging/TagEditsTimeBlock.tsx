import React, { useEffect, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useQuery, gql } from '@apollo/client';
import { fragmentTextForQuery } from '../../lib/vulcan-lib/fragments';
import withErrorBoundary from '../common/withErrorBoundary'

const INITIAL_LIMIT = 5

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
  const { ContentType, SingleLineTagUpdates, LoadMore } = Components;
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
        users {
          ...UsersMinimumInfo
        }
      }
    }
    ${fragmentTextForQuery('TagBasicInfo')}
    ${fragmentTextForQuery('UsersMinimumInfo')}
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
  const [expanded, setExpanded] = useState(false)
  
  let tagUpdatesInTimeBlock = [...(data?.TagUpdatesInTimeBlock || [])]
    .sort((update1, update2) => {
      if (update1.added > update2.added) return -1
      if (update2.added > update1.added) return 1
      return 0
    })
  if (!expanded) {
    tagUpdatesInTimeBlock = tagUpdatesInTimeBlock.slice(0, INITIAL_LIMIT)
  }
  
  if (!data?.TagUpdatesInTimeBlock?.length)
    return null;
  return <div className={classes.root}>
    <div className={classes.subtitle}>
      <ContentType type="tags" label="Wiki/Tag Page Edits and Discussion"/>
    </div>
    {tagUpdatesInTimeBlock.map(tagUpdates => <SingleLineTagUpdates
      key={tagUpdates.tag._id}
      tag={tagUpdates.tag}
      revisionIds={tagUpdates.revisionIds}
      commentIds={tagUpdates.commentIds}
      users={tagUpdates.users}
      commentCount={tagUpdates.commentCount}
      changeMetrics={{added: tagUpdates.added, removed: tagUpdates.removed}}
    />)}
    {!expanded && tagUpdatesInTimeBlock.length >= INITIAL_LIMIT && <LoadMore
      loadMore={() => setExpanded(true)}
      count={tagUpdatesInTimeBlock.length}
      totalCount={data.TagUpdatesInTimeBlock.length}
    />}
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
