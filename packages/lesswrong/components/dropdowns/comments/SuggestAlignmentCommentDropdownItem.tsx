import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import ExposurePlus1 from '@/lib/vendor/@material-ui/icons/src/ExposurePlus1';
import Undo from '@/lib/vendor/@material-ui/icons/src/Undo';
import DropdownItem from "../DropdownItem";
import OmegaIcon from "../../icons/OmegaIcon";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";
import uniq from 'lodash/uniq';
import without from 'lodash/without';

const SuggestAlignmentCommentUpdateMutation = gql(`
  mutation updateCommentSuggestAlignmentCommentDropdownItem($selector: SelectorInput!, $data: UpdateCommentDataInput!) {
    updateComment(selector: $selector, data: $data) {
      data {
        ...SuggestAlignmentComment
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

const SuggestAlignmentCommentDropdownItem = ({ comment, post, classes }: {
  comment: CommentsList,
  post?: PostsDetails,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const [updateComment] = useMutation(SuggestAlignmentCommentUpdateMutation);

  if (
    !post?.af ||
    comment.af ||
    !currentUser ||
    !userCanDo(currentUser, 'comments.alignment.suggest')
  ) {
    return null;
  }

  const userHasSuggested = comment.suggestForAlignmentUserIds &&
    comment.suggestForAlignmentUserIds.includes(currentUser!._id);
  if (!userHasSuggested) {
    return (
      <DropdownItem
        title="Suggest for Alignment"
        onClick={() => void updateComment({
          variables: {
            selector: { _id: comment._id},
            data: {suggestForAlignmentUserIds: uniq([...comment.suggestForAlignmentUserIds, currentUser._id])}
          }
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
        void updateComment({
          variables: {
            selector: { _id: comment._id},
            data: {suggestForAlignmentUserIds: without(comment.suggestForAlignmentUserIds, currentUser._id)}
          }
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

export default registerComponent(
  'SuggestAlignmentCommentDropdownItem', SuggestAlignmentCommentDropdownItem, {styles}
);


