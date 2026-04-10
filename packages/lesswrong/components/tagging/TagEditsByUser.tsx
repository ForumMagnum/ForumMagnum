import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import withErrorBoundary from '../common/withErrorBoundary'
import Loading from "../vulcan-core/Loading";
import { Typography } from "../common/Typography";
import SingleLineTagUpdates from "./SingleLineTagUpdates";
import LoadMore from "../common/LoadMore";
import { maybeDate } from '@/lib/utils/dateUtils';
import { NetworkStatus } from "@apollo/client";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const RevisionTagFragmentMultiQuery = gql(`
  query multiRevisionTagEditsByUserQuery($selector: RevisionSelector, $limit: Int, $enableTotal: Boolean) {
    revisions(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...RevisionTagFragment
      }
      totalCount
    }
  }
`);

const styles = defineStyles('TagEditsByUser', (theme: ThemeType) => ({
  root: {
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 6
  },
  wikiEmpty: {
    marginLeft: 8,
    fontStyle: "italic",
    color: theme.palette.grey[500]
  }
}));


const TagEditsByUser = ({userId, limit}: {
  userId: string,
  limit: number,
}) => {
  const classes = useStyles(styles);
  const { data, networkStatus, loadMoreProps } = useQueryWithLoadMore(RevisionTagFragmentMultiQuery, {
    variables: {
      selector: { revisionsByUser: { userId } },
      limit: 10,
      enableTotal: false,
    },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const results = data?.revisions?.results;

  const loadingInitial = networkStatus === NetworkStatus.loading;

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
      No wikitag contributions to display.
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
  hocs: [withErrorBoundary]
});
