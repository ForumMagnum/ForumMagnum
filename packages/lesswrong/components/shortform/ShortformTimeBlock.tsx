import React, { FC, useEffect } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import QuickTakesListItem from "../quickTakes/QuickTakesListItem";
import CommentsNode from "../comments/CommentsNode";
import LoadMore from "../common/LoadMore";
import ContentType from "../posts/PostsPage/ContentType";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";

const ShortformCommentsMultiQuery = gql(`
  query multiCommentShortformTimeBlockQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ShortformComments
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  shortformGroup: {
    marginTop: theme.isFriendlyUI ? 20 : 12,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 6
  },
  loadMore: {
    marginTop: 6
  }
})

const ShortformItem: FC<{comment: ShortformComments}> = ({comment}) => {
  if (!comment.post) {
    return null;
  }
  if (isFriendlyUI()) {
    return (
      <QuickTakesListItem quickTake={comment} />
    );
  }
  return (
    <CommentsNode
      treeOptions={{
        post: comment.post || undefined,
        forceSingleLine: true
      }}
      comment={comment}
      loadChildrenSeparately
    />
  );
}

const ShortformTimeBlock  = ({reportEmpty, before, after, terms, classes}: {
  reportEmpty: () => void,
  before: string
  after: string
  terms: CommentsViewTerms,
  classes: ClassesType<typeof styles>,
}) => {
  const { view, ...rest } = terms;
  const { data, loading, loadMoreProps } = useQueryWithLoadMore(ShortformCommentsMultiQuery, {
    variables: {
      selector: { [view]: { ...rest, before, after } },
      limit: 5,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network',
    itemsPerPage: 50,
  });

  const comments = data?.comments?.results;
  const { loadMore } = loadMoreProps;

  const totalCount = data?.comments?.totalCount ?? 0;

  useEffect(() => {
    if (!loading && !comments?.length && reportEmpty) {
      reportEmpty()
    }
  }, [loading, comments, reportEmpty]);

  if (!comments?.length) return null

  return <div>
    <div className={classes.shortformGroup}>
      <div className={classes.subtitle}>
        <ContentType
          type="shortform"
          label={preferredHeadingCase("Quick Takes")}
        />
      </div>
      {comments.map((comment) =>
        <ShortformItem key={comment._id} comment={comment} />
      )}
      {comments.length < totalCount! &&
        <div className={classes.loadMore}>
          <LoadMore
            loadMore={loadMore}
            count={comments.length}
            totalCount={totalCount}
          />
        </div>
      }
    </div>
  </div>
}

export default registerComponent('ShortformTimeBlock', ShortformTimeBlock, {styles});



