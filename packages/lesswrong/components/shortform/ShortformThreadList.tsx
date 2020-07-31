import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Comments } from '../../lib/collections/comments';

const styles = (theme: ThemeType): JssStyles => ({
  shortformItem: {
    marginTop: theme.spacing.unit*4
  }
})

const ShortformThreadList = ({ terms, classes }) => {
  const { LoadMore, CommentWithReplies, ShortformSubmitForm, Loading } = Components
  const { results, loading, loadMore, loadingMore, refetch } = useMulti({
    terms,
    collection: Comments,
    fragmentName: 'CommentWithRepliesFragment',
    fetchPolicy: 'cache-and-network',
    enableTotal: false,
    pollInterval: 0,
    ssr: true,
  });

  return (
    <div>
      <ShortformSubmitForm successCallback={refetch} />
      {loading || !results ? <Loading /> :
      <div>
        {results.map((comment, i) => {
          return <div key={comment._id} className={classes.shortformItem}>
            <CommentWithReplies comment={comment} post={comment.post} refetch={refetch}/>
          </div>
        })}
        { loadMore && <LoadMore loading={loadingMore || loading} loadMore={loadMore}  /> }
        { loadingMore && <Loading />}
      </div>}
    </div>
  )
}

const ShortformThreadListComponent = registerComponent('ShortformThreadList', ShortformThreadList, {styles});

declare global {
  interface ComponentTypes {
    ShortformThreadList: typeof ShortformThreadListComponent
  }
}

