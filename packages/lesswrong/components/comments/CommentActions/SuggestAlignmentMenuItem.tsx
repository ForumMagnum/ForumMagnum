import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { commentSuggestForAlignment, commentUnSuggestForAlignment } from '../../../lib/alignment-forum/comments/helpers'
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ExposurePlus1 from '@material-ui/icons/ExposurePlus1';
import Undo from '@material-ui/icons/Undo';

const styles = (theme: ThemeType): JssStyles => ({
  iconRoot: {
    position: "relative",
    width:24,
  },
  omegaIcon: {
    position:"absolute !important",
    left:0,
    top: "7px !important",
    opacity:.3
  },
  plusOneIcon: {
    marginLeft:8,
    color: theme.palette.text.maxIntensity,
    width:20
  },
  undoIcon: {
    marginLeft:8,
    width: 20,
    color: theme.palette.text.maxIntensity,
  }
})

const SuggestAlignmentMenuItem = ({ comment, post, classes }: {
  comment: CommentsList,
  post: PostsDetails,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { mutate: updateComment } = useUpdate({
    collectionName: "Comments",
    fragmentName: 'SuggestAlignmentComment',
  });
  const { OmegaIcon, MenuItem } = Components

  if (post.af && !comment.af && currentUser && userCanDo(currentUser, 'comments.alignment.suggest')) {

    const userHasSuggested = comment.suggestForAlignmentUserIds && comment.suggestForAlignmentUserIds.includes(currentUser!._id)

    if (!userHasSuggested) {
      return (
        <MenuItem onClick={() => commentSuggestForAlignment({ currentUser, comment, updateComment })}>
          <ListItemIcon>
            <span className={classes.iconRoot}>
              <OmegaIcon className={classes.omegaIcon}/>
              <ExposurePlus1 className={classes.plusOneIcon}/>
            </span>
          </ListItemIcon>
          Suggest for Alignment
        </MenuItem>
      )
    } else {
      return <MenuItem onClick={() => commentUnSuggestForAlignment({ currentUser, comment, updateComment })}>
        <ListItemIcon>
          <span className={classes.iconRoot}>
            <OmegaIcon className={classes.omegaIcon}/>
            <Undo className={classes.undoIcon}/>
          </span>
        </ListItemIcon>
          Unsuggest for Alignment
        </MenuItem>
    }
  } else {
    return null
  }
}

const SuggestAlignmentMenuItemComponent = registerComponent(
  'SuggestAlignmentMenuItem', SuggestAlignmentMenuItem, {styles}
);

declare global {
  interface ComponentTypes {
    SuggestAlignmentMenuItem: typeof SuggestAlignmentMenuItemComponent
  }
}

