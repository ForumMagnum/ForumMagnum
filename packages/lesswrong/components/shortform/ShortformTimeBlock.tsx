import React, { FC, useEffect } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';

const styles = (_: ThemeType) => ({
  shortformGroup: {
    marginTop: isFriendlyUI ? 20 : 12,
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
  if (isFriendlyUI) {
    return (
      <Components.QuickTakesListItem quickTake={comment} />
    );
  }
  return (
    <Components.CommentsNode
      treeOptions={{
        post: comment.post || undefined,
        forceSingleLine: true
      }}
      comment={comment}
      loadChildrenSeparately
    />
  );
}

const ShortformTimeBlockInner  = ({reportEmpty, before, after, terms, classes}: {
  reportEmpty: () => void,
  before: string
  after: string
  terms: CommentsViewTerms,
  classes: ClassesType<typeof styles>,
}) => {
  const {LoadMore, ContentType} = Components;

  const {totalCount, loadMore, loading, results: comments} = useMulti({
    terms: {
      ...terms,
      before, after,
    },
    collectionName: "Comments",
    fragmentName: 'ShortformComments',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
    limit: 5,
    itemsPerPage: 50,
  });

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

export const ShortformTimeBlock = registerComponent('ShortformTimeBlock', ShortformTimeBlockInner, {styles});

declare global {
  interface ComponentTypes {
    ShortformTimeBlock: typeof ShortformTimeBlock
  }
}

