import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import withErrorBoundary from '../common/withErrorBoundary'
import { taggingNameIsSet, taggingNameSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType) => ({
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
  classes: ClassesType<typeof styles>
}) => {

  const { loadingInitial, loadMoreProps, results } = useMulti({
    terms: {view: "revisionsByUser", userId, limit},
    collectionName: "Revisions",
    fragmentName: 'RevisionTagFragment',
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-only",
  });

  if (loadingInitial || !results) {
    return <Components.Loading />
  }

  const resultsWithLiveTags = results
    .filter(tagUpdates => {
      const hasLiveTag = tagUpdates.tag && !tagUpdates.tag.deleted;
      const hasLiveLensTag = tagUpdates.lens?.parentTag && !tagUpdates.lens?.parentTag.deleted;
      return hasLiveTag || hasLiveLensTag;
    });

  if (resultsWithLiveTags.length === 0) {
    return <Components.Typography variant="body2" className={classes.wikiEmpty}>
      No {taggingNameIsSet.get() ? taggingNameSetting.get() : 'wiki'} contributions to display.
    </Components.Typography>
  }

  return <div className={classes.root}>
    {resultsWithLiveTags.map(tagUpdates => {
      const topLevelTag = tagUpdates.tag ?? tagUpdates.lens?.parentTag;
      return <Components.SingleLineTagUpdates
        key={tagUpdates.documentId + " " + tagUpdates.editedAt}
        tag={topLevelTag!}
        revisionIds={[tagUpdates._id]}
        changeMetrics={{added: tagUpdates.changeMetrics.added, removed: tagUpdates.changeMetrics.removed}}
        lastRevisedAt={tagUpdates.editedAt}
      />
    })}
    <Components.LoadMore {...loadMoreProps} />
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
