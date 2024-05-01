import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import { userCanComment } from '../../lib/vulcan-users/permissions';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  shortformItem: {
    marginTop: theme.spacing.unit * (isFriendlyUI ? 2 : 4),
  }
})

const ShortformThreadList = ({ classes }: {
  classes: ClassesType,
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
      {userCanComment(currentUser) &&
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

const ShortformThreadListComponent = registerComponent('ShortformThreadList', ShortformThreadList, {styles});

declare global {
  interface ComponentTypes {
    ShortformThreadList: typeof ShortformThreadListComponent
  }
}
