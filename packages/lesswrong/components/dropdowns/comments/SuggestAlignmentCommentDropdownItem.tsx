import React from 'react';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import ExposurePlus1 from '@/lib/vendor/@material-ui/icons/src/ExposurePlus1';
import Undo from '@/lib/vendor/@material-ui/icons/src/Undo';
import DropdownItem from "../DropdownItem";
import OmegaIcon from "../../icons/OmegaIcon";
import { useMutation } from "@apollo/client/react";
import { SetCommentSuggestedForAlignmentMutation } from '../../alignment-forum/alignmentSuggestionMutations';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SuggestAlignmentCommentDropdownItem', (theme: ThemeType) => ({
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
}))

const SuggestAlignmentCommentDropdownItem = ({comment, post}: {
  comment: CommentsList,
  post?: PostsDetails,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [setCommentSuggestedForAlignment] = useMutation(SetCommentSuggestedForAlignmentMutation);

  if (
    !post?.af ||
    comment.af ||
    !currentUser ||
    !userCanDo(currentUser, 'comments.alignment.suggest') ||
    comment.draft
  ) {
    return null;
  }

  const userHasSuggested = comment.suggestForAlignmentUserIds &&
    comment.suggestForAlignmentUserIds.includes(currentUser!._id);
  if (!userHasSuggested) {
    return (
      <DropdownItem
        title="Suggest for Alignment"
        onClick={() => void setCommentSuggestedForAlignment({
          variables: { commentId: comment._id, suggested: true }
        })}
        icon={() =>
          <span className={classes.iconRoot}>
            <OmegaIcon className={classes.omegaIcon}/>
            <ExposurePlus1 className={classes.plusOneIcon}/>
          </span>
        }
      />
    );
  }

  return (
    <DropdownItem
      title="Unsuggest for Alignment"
      onClick={() => (
        void setCommentSuggestedForAlignment({
          variables: { commentId: comment._id, suggested: false }
        })
      )}
      icon={() =>
        <span className={classes.iconRoot}>
          <OmegaIcon className={classes.omegaIcon}/>
          <Undo className={classes.undoIcon}/>
        </span>
      }
    />
  );
}

export default SuggestAlignmentCommentDropdownItem;
