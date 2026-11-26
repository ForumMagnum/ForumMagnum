import React from 'react';
import { useMessages } from '../../common/withMessages';
import { useApolloClient, useMutation } from "@apollo/client/react";
import { useCurrentUser } from '../../common/withUser';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import ArrowRightAlt from '@/lib/vendor/@material-ui/icons/src/ArrowRightAlt';
import Undo from '@/lib/vendor/@material-ui/icons/src/Undo';
import DropdownItem from "../DropdownItem";
import OmegaIcon from "../../icons/OmegaIcon";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const AlignmentCommentMutation = gql(`
  mutation alignmentComment($commentId: String!, $af: Boolean!) {
    alignmentComment(commentId: $commentId, af: $af) {
      ...CommentsList
    }
  }
`);

const styles = defineStyles("MoveToAlignmentCommentDropdownItem", (theme: ThemeType) => ({
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
}));

const MoveToAlignmentCommentDropdownItem = ({comment, post}: {
  comment: CommentsList,
  post?: PostsBase,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const client = useApolloClient();
  const {flash} = useMessages();
  const [setAlignmentComment] = useMutation(AlignmentCommentMutation);

  const handleMoveToAlignmentCommentForum = async () => {
    await setAlignmentComment({
      variables: { commentId: comment._id, af: true }
    })
    await client.resetStore()
    flash("Comment and its parents moved to AI Alignment Forum")
  }

  const handleRemoveFromAlignmentForum = async () => {
    await setAlignmentComment({
      variables: { commentId: comment._id, af: false }
    })

    await client.resetStore()
    flash("Comment and its children removed from AI Alignment Forum")
  }

  if (!post?.af || !userCanDo(currentUser, 'comments.alignment.move.all') || comment.draft) {
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

export default MoveToAlignmentCommentDropdownItem;


