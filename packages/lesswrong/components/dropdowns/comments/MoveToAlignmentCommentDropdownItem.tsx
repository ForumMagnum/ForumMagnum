import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useMessages } from '../../common/withMessages';
import { useApolloClient } from '@apollo/client/react/hooks';
import { useCurrentUser } from '../../common/withUser';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import ListItemIcon from '@/lib/vendor/@material-ui/core/src/ListItemIcon';
import ArrowRightAlt from '@/lib/vendor/@material-ui/icons/src/ArrowRightAlt';
import Undo from '@/lib/vendor/@material-ui/icons/src/Undo';
import DropdownItem from "../DropdownItem";
import OmegaIcon from "../../icons/OmegaIcon";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const CommentsListUpdateMutation = gql(`
  mutation updateCommentMoveToAlignmentCommentDropdownItem($selector: SelectorInput!, $data: UpdateCommentDataInput!) {
    updateComment(selector: $selector, data: $data) {
      data {
        ...CommentsList
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
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
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const client = useApolloClient();
  const {flash} = useMessages();
  const [updateComment] = useMutation(CommentsListUpdateMutation);

  const handleMoveToAlignmentCommentForum = async () => {
    if (!currentUser) return;
    await updateComment({
      variables: {
        selector: { _id: comment._id },
        data: {
          af: true,
          afDate: new Date(),
          moveToAlignmentUserId: currentUser._id
        }
      }
    })
    await client.resetStore()
    flash("Comment and its parents moved to AI Alignment Forum")
  }

  const handleRemoveFromAlignmentForum = async () => {
    await updateComment({
      variables: {
        selector: { _id: comment._id },
        data: {
          af: false,
          afDate: null,
          moveToAlignmentUserId: null
        }
      }
    })

    await client.resetStore()
    flash("Comment and its children removed from AI Alignment Forum")
  }

  if (!post?.af || !userCanDo(currentUser, 'comments.alignment.move.all')) {
    return null;
  }
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

export default registerComponent(
  'MoveToAlignmentCommentDropdownItem', MoveToAlignmentCommentDropdownItem, {styles}
);


