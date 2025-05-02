import React, { useCallback, useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import AddBoxIcon from '@/lib/vendor/@material-ui/icons/src/AddBox'
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType) => ({
  subheader: {
    fontSize: 14,
  },
  shortformSubmitForm: {
    marginTop: 6,
    marginBottom: 12,
  },
  noResults: {
    marginLeft: 8,
    color: theme.palette.text.dim4,
  }
});

const CommentsDraftList = ({userId, initialLimit, itemsPerPage, showTotal, classes}: {
  userId: string,
  initialLimit?: number,
  itemsPerPage?: number,
  showTotal?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser(); // TODO will use

  const { Loading, CommentsNode, LoadMore } = Components;

  const { results, loading, count, totalCount, loadMoreProps } = useMulti({
    // TODO replace with actual draft comments. Currently this is just getting all user comments
    terms: {view: 'profileComments', sortBy: "new", authorIsUnreviewed: null, userId},
    limit: initialLimit,
    itemsPerPage,
    enableTotal: true,
    collectionName: "Comments",
    fragmentName: 'DraftComments',
  });

  if (loading && !results?.length) {
    return <Loading/>;
  }

  const showLoadMore = !loading && (count === undefined || totalCount === undefined || count < totalCount)

  return <>
    {(!loading && results?.length === 0) && (
      <Components.Typography variant="body2" className={classes.noResults}>
        No comments to display.
      </Components.Typography>
    )}
    {!!results && results.map((comment) => (
      <CommentsNode
        comment={comment}
        key={comment._id}
        treeOptions={{
          condensed: true,
          singleLineCollapse: true,
          hideSingleLineMeta: true,
          singleLinePostTitle: true,
          showPostTitle: true,
          post: comment.post || undefined,
          forceSingleLine: true
        }}
      />
    ))}
    {loading && <Loading/>}
    {showLoadMore && <LoadMore {...{
      ...loadMoreProps,
      totalCount: showTotal ? totalCount : undefined,
    }} />}

  </>;
}

const CommentsDraftListComponent = registerComponent(
  'CommentsDraftList',
  CommentsDraftList,
  {styles, stylePriority: 1},
);

declare global {
  interface ComponentTypes {
    CommentsDraftList: typeof CommentsDraftListComponent
  }
}
