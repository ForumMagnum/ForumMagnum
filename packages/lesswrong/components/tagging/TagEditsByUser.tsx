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
  wikiEmpty: {
    marginLeft: theme.spacing.unit,
    fontStyle: "italic",
    color: theme.palette.grey[500]
  }
});


const TagEditsByUser = ({userId, limit, classes}: {
  userId: string,
  limit: number,
  classes: ClassesType
}) => {
  const { data, loading } = useQuery(gql`
    query getTagUpdates($userId: String!, $limit: Int!, $skip: Int!) {
      TagUpdatesByUser(userId: $userId, limit: $limit, skip: $skip) {
        tag {
          ...TagBasicInfo
        }
        revisionIds
        lastRevisedAt
        added
        removed
      }
    }
    ${fragmentTextForQuery('TagBasicInfo')}
  `, {
    variables: {
      userId, limit, skip: 0,
    },
    ssr: true,
  });
  
  if (!data?.TagUpdatesByUser?.length)
    return (<Components.Typography variant="body2" className={classes.wikiEmpty}>No wiki contributions to display.</Components.Typography>)

  return <div className={classes.root}>
    {data.TagUpdatesByUser.map(tagUpdates => <Components.SingleLineTagUpdates
      key={tagUpdates.tag._id}
      tag={tagUpdates.tag}
      revisionIds={tagUpdates.revisionIds}
      changeMetrics={{added: tagUpdates.added, removed: tagUpdates.removed}}
      lastRevisedAt={tagUpdates.lastRevisedAt}
    />)}
  </div>
}

const TagEditsByUserComponent = registerComponent('TagEditsByUser', TagEditsByUser, {
  styles, hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    TagEditsByUser: typeof TagEditsByUserComponent
  }
}
