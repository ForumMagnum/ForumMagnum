import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withUpdate } from '../../../lib/crud/withUpdate';
import MenuItem from '@material-ui/core/MenuItem';
import { Comments } from '../../../lib/collections/comments'
import Users from 'meteor/vulcan:users';
import withUser from '../../common/withUser';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ExposurePlus1 from '@material-ui/icons/ExposurePlus1';
import Undo from '@material-ui/icons/Undo';
import { withStyles, createStyles } from '@material-ui/core/styles'

const styles = createStyles(theme => ({
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
    color: "black",
    width:20
  },
  undoIcon: {
    marginLeft:8,
    width: 20,
    color: "black"
  }
}))

const SuggestAlignmentMenuItem = ({ currentUser, comment, post, updateComment, classes }) => {
  const { OmegaIcon } = Components

  if (post.af && !comment.af && Users.canDo(currentUser, 'comments.alignment.suggest')) {

    const userHasSuggested = comment.suggestForAlignmentUserIds && comment.suggestForAlignmentUserIds.includes(currentUser._id)

    if (!userHasSuggested) {
      return (
        <MenuItem onClick={() => Comments.suggestForAlignment({ currentUser, comment, updateComment })}>
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
      return <MenuItem onClick={() => Comments.unSuggestForAlignment({ currentUser, comment, updateComment })}>
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
 'SuggestAlignmentMenuItem', SuggestAlignmentMenuItem,
  withUpdate({
    collection: Comments,
    fragmentName: 'SuggestAlignmentComment',
  }),
  withStyles(styles, {name:'SuggestAlignmentMenuItem'}),
  withUser
);

declare global {
  interface ComponentTypes {
    SuggestAlignmentMenuItem: typeof SuggestAlignmentMenuItemComponent
  }
}

