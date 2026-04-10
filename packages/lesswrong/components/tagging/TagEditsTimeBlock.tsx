import React, { useEffect, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from '@/lib/generated/gql-codegen';
import withErrorBoundary from '../common/withErrorBoundary'
import ContentType from "../posts/PostsPage/ContentType";
import SingleLineTagUpdates from "./SingleLineTagUpdates";
import LoadMore from "../common/LoadMore";
import { withDateFields } from '@/lib/utils/dateUtils';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const INITIAL_LIMIT = 5

const styles = defineStyles('TagEditsTimeBlock', (theme: ThemeType) => ({
  subtitle: {
    marginTop: 6,
    marginBottom: 6
  },
}));

// The server-side TagUpdatesInTimeBlock resolver enforces a one-day cap on
// the (before - after) window. We mirror that here so we can skip the query
// entirely if a wider range somehow gets passed in, instead of firing a request
// the server will just refuse / no-op.
const MAX_TAG_UPDATES_WINDOW_HOURS = 30;

const TagEditsTimeBlock = ({before, after, reportEmpty}: {
  before: Date,
  after: Date,
  reportEmpty: () => void,
}) => {
  const classes = useStyles(styles);

  const windowHours = (before.getTime() - after.getTime()) / (60 * 60 * 1000);
  const windowTooWide = windowHours > MAX_TAG_UPDATES_WINDOW_HOURS;

  // TODO: see if we can use a fragment other than TagHistoryFragment to avoid fetching the ToC or other expensive stuff
  const { data, loading } = useQuery(gql(`
    query getTagUpdates($before: Date!, $after: Date!) {
      TagUpdatesInTimeBlock(before: $before, after: $after) {
        tag {
          ...TagHistoryFragment
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
        documentDeletions {
          userId
          documentId
          netChange
          type
          docFields {
            _id
            slug
            tabTitle
            tabSubtitle
          }
          createdAt
        }
      }
    }
  `), {
    variables: {
      before, after,
    },
    ssr: true,
    skip: windowTooWide,
  });

  useEffect(() => {
    if (windowTooWide || (!loading && !data?.TagUpdatesInTimeBlock?.length)) {
      reportEmpty();
    }
  }, [windowTooWide, loading, data, reportEmpty]);
  const [expanded, setExpanded] = useState(false)

  if (windowTooWide) {
    return null;
  }

  let tagUpdatesInTimeBlock = [...(data?.TagUpdatesInTimeBlock || [])]
    .sort((update1, update2) => {
      if ((update1.added ?? 0) > (update2.added ?? 0)) return -1
      if ((update2.added ?? 0) > (update1.added ?? 0)) return 1
      return 0
    })
  if (!expanded) {
    tagUpdatesInTimeBlock = tagUpdatesInTimeBlock.slice(0, INITIAL_LIMIT)
  }
  
  if (!data?.TagUpdatesInTimeBlock?.length)
    return null;
  return <div>
    <div className={classes.subtitle}>
      <ContentType
        type="tags"
        label={"Wikitag Page Edits and Discussion"}
      />
    </div>
    {tagUpdatesInTimeBlock.map(tagUpdates => <SingleLineTagUpdates
      key={tagUpdates.tag._id}
      tag={tagUpdates.tag}
      revisionIds={tagUpdates.revisionIds}
      commentIds={tagUpdates.commentIds}
      users={tagUpdates.users}
      commentCount={tagUpdates.commentCount}
      changeMetrics={{added: tagUpdates.added, removed: tagUpdates.removed}}
      documentDeletions={tagUpdates.documentDeletions.map(documentDeletion => withDateFields(documentDeletion, ['createdAt']))}
    />)}
    {!expanded && tagUpdatesInTimeBlock.length >= INITIAL_LIMIT && <LoadMore
      loadMore={() => setExpanded(true)}
      count={tagUpdatesInTimeBlock.length}
      totalCount={data.TagUpdatesInTimeBlock.length}
    />}
  </div>
}

export default registerComponent('TagEditsTimeBlock', TagEditsTimeBlock, {
  hocs: [withErrorBoundary]
});
