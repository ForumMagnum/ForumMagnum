import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import withErrorBoundary from '../common/withErrorBoundary'
import { taggingNameIsSet, taggingNameSetting } from '../../lib/instanceSettings';
import Loading from "../vulcan-core/Loading";
import { Typography } from "../common/Typography";
import SingleLineTagUpdates from "./SingleLineTagUpdates";
import LoadMore from "../common/LoadMore";
import { maybeDate } from '@/lib/utils/dateUtils';

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
    return <Loading />
  }

  const resultsWithLiveTags = results
    .filter(tagUpdates => {
      const hasLiveTag = tagUpdates.tag && !tagUpdates.tag.deleted;
      const hasLiveLensTag = tagUpdates.lens?.parentTag && !tagUpdates.lens?.parentTag.deleted;
      return hasLiveTag || hasLiveLensTag;
    });

  if (resultsWithLiveTags.length === 0) {
    return <Typography variant="body2" className={classes.wikiEmpty}>
      No {taggingNameIsSet.get() ? taggingNameSetting.get() : 'wiki'} contributions to display.
    </Typography>
  }

  return <div className={classes.root}>
    {resultsWithLiveTags.map(tagUpdates => {
      const topLevelTag = tagUpdates.tag ?? tagUpdates.lens?.parentTag;
      return <SingleLineTagUpdates
        key={tagUpdates.documentId + " " + tagUpdates.editedAt}
        tag={topLevelTag!}
        revisionIds={[tagUpdates._id]}
        changeMetrics={{added: tagUpdates.changeMetrics.added, removed: tagUpdates.changeMetrics.removed}}
        lastRevisedAt={maybeDate(tagUpdates.editedAt)}
      />
    })}
    <LoadMore {...loadMoreProps} />
  </div>
}

export default registerComponent('TagEditsByUser', TagEditsByUser, {
  styles, hocs: [withErrorBoundary]
});


