import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdateComment } from '../../hooks/useUpdateComment';
import { useMessages } from '../../common/withMessages';
import { useApolloClient } from '@apollo/client/react/hooks';
import { useCurrentUser } from '../../common/withUser';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ArrowRightAlt from '@material-ui/icons/ArrowRightAlt';
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
  moveIcon: {
    marginLeft:8,
    color: theme.palette.text.maxIntensity,
  },
  undoIcon: {
    marginLeft:8,
    width: 20,
    color: theme.palette.text.maxIntensity,
  }
})

const MoveToAlignmentCommentDropdownItem = ({comment, post, classes}: {
  comment: CommentsList,
  post?: PostsBase,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const client = useApolloClient();
  const {flash} = useMessages();
  const updateComment = useUpdateComment();
  
  const handleMoveToAlignmentCommentForum = async () => {
    if (!currentUser) return;
    await updateComment(comment._id, {
      af: true,
      afDate: new Date(),
      moveToAlignmentUserId: currentUser._id
    })
    await client.resetStore()
    flash("Comment and its parents moved to AI Alignment Forum")
  }

  const handleRemoveFromAlignmentForum = async () => {
    await updateComment(comment._id, {
      af: false,
      afDate: null,
      moveToAlignmentUserId: null
    });

    await client.resetStore()
    flash("Comment and its children removed from AI Alignment Forum")
  }

  if (!post?.af || !userCanDo(currentUser, 'comments.alignment.move.all')) {
    return null;
  }

  const {DropdownItem, OmegaIcon} = Components
  if (!comment.af) {
    return (
      <DropdownItem
        title="Move to Alignment"
        onClick={handleMoveToAlignmentCommentForum}
        icon={() => (
          <span className={classes.iconRoot}>
            <OmegaIcon className={classes.omegaIcon}/>
            <ArrowRightAlt className={classes.moveIcon}/>
          </span>
        )}
      />
    );
  }
  return (
    <DropdownItem
      title="Remove from Alignment"
      onClick={handleRemoveFromAlignmentForum}
      icon={() => (
        <span className={classes.iconRoot}>
          <OmegaIcon className={classes.omegaIcon} />
          <Undo className={classes.undoIcon}/>
        </span>
      )}
    />
  );
}

const MoveToAlignmentCommentDropdownItemComponent = registerComponent(
  'MoveToAlignmentCommentDropdownItem', MoveToAlignmentCommentDropdownItem, {styles}
);

declare global {
  interface ComponentTypes {
    MoveToAlignmentCommentDropdownItem: typeof MoveToAlignmentCommentDropdownItemComponent
  }
}
