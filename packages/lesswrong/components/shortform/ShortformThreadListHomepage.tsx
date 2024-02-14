import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import { userCanComment } from '../../lib/vulcan-users/permissions';
import { isFriendlyUI } from '../../themes/forumTheme';
import classNames from 'classnames';


const styles = (theme: ThemeType): JssStyles => ({
  shortformItem: {
    //marginTop: theme.spacing.unit * (isFriendlyUI ? 2 : 4),
  },
  bottomBorder: {
    // borderBottom: theme.palette.border.itemSeparatorBottom, // this should maybe go somewhere, but not here
  },

})

const ShortformThreadListHomepage = ({ classes }: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const {results, loadMoreProps, refetch} = useMulti({
    terms: {
      view: 'shortformFrontpage',
      limit:3,
      maxAgeDays: 30
    },
    collectionName: "Comments",
    fragmentName: 'CommentWithRepliesFragment',
    fetchPolicy: 'cache-and-network',
    enableTotal: false,
    pollInterval: 0,
    itemsPerPage: 5
  });

  const {
    LoadMore, CommentOnPostWithReplies, ShortformSubmitForm,
    QuickTakesEntry,
  } = Components;

  const shortform = true;

  return (
    <div>
      {isFriendlyUI && userCanComment(currentUser) &&
        <QuickTakesEntry currentUser={currentUser} successCallback={refetch} />
      }
      {!isFriendlyUI && <ShortformSubmitForm successCallback={refetch} />}

      {results && results.map((comment) => {
        if (!comment.post) {
          return null;
        }
        return <div key={comment._id} className={classNames(classes.shortformItem, classes.bottomBorder)}>
          <CommentOnPostWithReplies comment={comment} post={comment.post} commentNodeProps={{
            treeOptions: {
              refetch,
              forceSingleLine: true,
            },
            shortform,
          }} startExpanded={false} />
        </div>
      })}
      <LoadMore {...loadMoreProps} />
    </div>
  )
}

const ShortformThreadListHomepageComponent = registerComponent('ShortformThreadListHomepage', ShortformThreadListHomepage, {styles});

declare global {
  interface ComponentTypes {
    ShortformThreadListHomepage: typeof ShortformThreadListHomepageComponent
  }
}
