import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { isEAForum } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  shortformItem: {
    marginTop: theme.spacing.unit * (isEAForum ? 2 : 4),
  }
})

const ShortformThreadList = ({ classes }: {
  classes: ClassesType,
}) => {
  const { LoadMore, CommentOnPostWithReplies, ShortformSubmitForm } = Components
  const { results, loadMoreProps, refetch } = useMulti({
    terms: {
      view: 'shortform',
      limit:20
    },
    collectionName: "Comments",
    fragmentName: 'CommentWithRepliesFragment',
    fetchPolicy: 'cache-and-network',
    enableTotal: false,
    pollInterval: 0,
  });

  return (
    <div>
      <ShortformSubmitForm successCallback={refetch} />
      
      {results && results.map((comment, i) => {
        if (!comment.post) return null
        return <div key={comment._id} className={classes.shortformItem}>
          <CommentOnPostWithReplies comment={comment} post={comment.post} commentNodeProps={{
            treeOptions: {
              refetch
            }
          }}/>
        </div>
      })}
      <LoadMore {...loadMoreProps} />
    </div>
  )
}

const ShortformThreadListComponent = registerComponent('ShortformThreadList', ShortformThreadList, {styles});

declare global {
  interface ComponentTypes {
    ShortformThreadList: typeof ShortformThreadListComponent
  }
}

