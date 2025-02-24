import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { commentSuggestForAlignment, commentUnSuggestForAlignment } from '../../../lib/alignment-forum/comments/helpers'
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import ExposurePlus1 from '@material-ui/icons/ExposurePlus1';
import Undo from '@material-ui/icons/Undo';

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
  const { mutate: updateComment } = useUpdate({
    collectionName: "Comments",
    fragmentName: 'SuggestAlignmentComment',
  });

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

  const {DropdownItem, OmegaIcon} = Components
  if (!userHasSuggested) {
    return (
      <DropdownItem
        title="Suggest for Alignment"
        onClick={() =>
          commentSuggestForAlignment({currentUser, comment, updateComment})
        }
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
      onClick={() =>
        commentUnSuggestForAlignment({currentUser, comment, updateComment})
      }
      icon={() =>
        <span className={classes.iconRoot}>
          <OmegaIcon className={classes.omegaIcon}/>
          <Undo className={classes.undoIcon}/>
        </span>
      }
    />
  );
}

const SuggestAlignmentCommentDropdownItemComponent = registerComponent(
  'SuggestAlignmentCommentDropdownItem', SuggestAlignmentCommentDropdownItem, {styles}
);

declare global {
  interface ComponentTypes {
    SuggestAlignmentCommentDropdownItem: typeof SuggestAlignmentCommentDropdownItemComponent
  }
}
