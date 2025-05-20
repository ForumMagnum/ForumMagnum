import React, {  } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Typography } from '../common/Typography';
import Loading from '../vulcan-core/Loading';
import LoadMore from '../common/LoadMore';
import CommentsNode from './CommentsNode';
import { AnalyticsContext } from '@/lib/analyticsEvents';

const styles = (theme: ThemeType) => ({
  heading: {
    display: 'flex',
    marginBottom: 8,
    fontSize: 16,
    fontWeight: 600,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  noResults: {
    marginLeft: 8,
    color: theme.palette.text.dim4,
  }
});

const CommentsDraftList = ({userId, postId, initialLimit, itemsPerPage, showTotal, silentIfEmpty, classes}: {
  userId: string,
  postId?: string,
  initialLimit?: number,
  itemsPerPage?: number,
  showTotal?: boolean,
  silentIfEmpty?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { results, loading, count, totalCount, loadMoreProps } = useMulti({
    terms: { view: "draftComments", userId, postId, drafts: "drafts-only" },
    limit: initialLimit,
    itemsPerPage,
    enableTotal: true,
    collectionName: "Comments",
    fragmentName: 'DraftComments',
  });

  if (loading && !results?.length) {
    return !silentIfEmpty ? <Loading/> : null;
  }

  const showLoadMore = !loading && (count === undefined || totalCount === undefined || count < totalCount)

  return <AnalyticsContext pageElementContext="commentsDraftList">
    {(!silentIfEmpty || !!results?.length) && <Typography variant="headline" className={classes.heading}>Draft comments</Typography>}
    {(!silentIfEmpty && !loading && results?.length === 0) && (
      <Typography variant="body2" className={classes.noResults}>
        No comments to display.
      </Typography>
    )}
    {!!results && results.map((comment) => (
      <CommentsNode
        comment={comment}
        key={comment._id}
        treeOptions={{
          condensed: true,
          singleLineCollapse: true,
          hideSingleLineMeta: true,
          singleLinePostTitle: !postId,
          showPostTitle: !postId,
          post: comment.post || undefined,
          forceSingleLine: true,
          initialShowEdit: true,
          showEditInContext: true,
        }}
      />
    ))}
    {loading && <Loading/>}
    {showLoadMore && <LoadMore {...{
      ...loadMoreProps,
      totalCount: showTotal ? totalCount : undefined,
    }} />}
  </AnalyticsContext>;
}

export default registerComponent(
  'CommentsDraftList',
  CommentsDraftList,
  {styles, stylePriority: 1},
);
