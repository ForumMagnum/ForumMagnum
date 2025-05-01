import React, { useCallback, useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent } from '../../lib/vulcan-lib/components';
import AddBoxIcon from '@/lib/vendor/@material-ui/icons/src/AddBox'
import { useCurrentUser } from '../common/withUser';
import { Typography } from '../common/Typography';
import Loading from '../vulcan-core/Loading';
import ShortformListItem from '../shortform/ShortformListItem';
import LoadMore from '../common/LoadMore';

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
  const currentUser = useCurrentUser();

  const { results, loading, count, totalCount, loadMoreProps } = useMulti({
    // TODO replace with actual draft comments. Currently this is just getting all user comments
    terms: {view: 'profileComments', sortBy: "new", authorIsUnreviewed: null, userId},
    limit: initialLimit,
    itemsPerPage,
    enableTotal: true,
    collectionName: "Comments",
    fragmentName: 'ShortformComments',
  });

  if (loading && !results?.length) {
    return <Loading/>;
  }
  if (!results?.length) {
    return null;
  }

  const showLoadMore = !loading && (count === undefined || totalCount === undefined || count < totalCount)
  return <>
    {(!loading && results.length === 0) && (
      <Typography variant="body2" className={classes.noResults}>
        No comments to display.
      </Typography>
    )}
    {results.map((comment) => {
      return <ShortformListItem
        comment={comment}
        key={comment._id}
        hideTag={true}
      />
    })}
    {loading && <Loading/>}
    {showLoadMore && <LoadMore {...{
      ...loadMoreProps,
      totalCount: showTotal ? totalCount : undefined,
    }} />}

  </>;
}

export default registerComponent(
  'CommentsDraftList',
  CommentsDraftList,
  {styles, stylePriority: 1},
);
