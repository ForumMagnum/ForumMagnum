import React, { useEffect } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';

const styles = (theme: ThemeType): JssStyles => ({
  shortformGroup: {
    marginTop: 12,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 6
  },
  loadMore: {
    marginTop: 6
  }
})

const ShortformTimeBlock  = ({reportEmpty, terms, classes}: {
  reportEmpty: ()=>void,
  terms: CommentsViewTerms,
  classes: ClassesType,
}) => {
  const { CommentsNode, LoadMore, ContentType } = Components
  
  const { totalCount, loadMore, loading, results:comments } = useMulti({
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
        <ContentType type="shortform" label="Shortform"/>
      </div>
      {comments?.map((comment, i) => {
        if (!comment.post)
          return null;
        return <CommentsNode
          treeOptions={{
            post: comment.post || undefined,
            forceSingleLine: true
          }}
          comment={comment}
          key={comment._id}
          loadChildrenSeparately
        />
      })}
      {comments?.length < totalCount! &&
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

