import React, { FC, useEffect } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { isEAForum } from '../../lib/instanceSettings';

const styles = (_: ThemeType): JssStyles => ({
  shortformGroup: {
    marginTop: isEAForum ? -10 : 12,
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
  if (isEAForum) {
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

const ShortformTimeBlock  = ({reportEmpty, terms, classes}: {
  reportEmpty: ()=>void,
  terms: CommentsViewTerms,
  classes: ClassesType,
}) => {
  const {LoadMore, ContentType} = Components;

  const {totalCount, loadMore, loading, results: comments} = useMulti({
    terms,
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
          label={isEAForum ? "Quick takes" : "Shortform"}
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

const ShortformTimeBlockComponent = registerComponent('ShortformTimeBlock', ShortformTimeBlock, {styles});

declare global {
  interface ComponentTypes {
    ShortformTimeBlock: typeof ShortformTimeBlockComponent
  }
}

