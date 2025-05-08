import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import { userCanQuickTake } from '../../lib/vulcan-users/permissions';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  shortformItem: {
    marginTop: theme.spacing.unit * (isFriendlyUI ? 2 : 4),
  }
})

const ShortformThreadListInner = ({ classes }: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const {results, loadMoreProps, refetch} = useMulti({
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

  const { LoadMore, CommentOnPostWithReplies, QuickTakesEntry } = Components;
  
  return (
    <div>
      {(userCanQuickTake(currentUser) || !currentUser) &&
        <QuickTakesEntry currentUser={currentUser} successCallback={refetch} />
      }

      {results && results.map((comment) => {
        if (!comment.post) {
          return null;
        }
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

export const ShortformThreadList = registerComponent('ShortformThreadList', ShortformThreadListInner, {styles});

declare global {
  interface ComponentTypes {
    ShortformThreadList: typeof ShortformThreadList
  }
}
