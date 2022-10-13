import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';
import { useTracking } from "../../lib/analyticsEvents";
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { TagCommentType } from '../../lib/collections/comments/types';
import { NEW_COMMENT_MARGIN_BOTTOM } from '../comments/CommentsListSection';
import { Option } from '../common/InlineSelect';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "center",
    padding: 7,
    justifyContent: "space-around",
    backgroundColor: theme.palette.grey[100],
  },
  subscribeButton: {
    textTransform: 'none',
    fontSize: 16,
    boxShadow: 'none',
    paddingLeft: 24,
    paddingRight: 24,
  },
  newComment: {
    border: theme.palette.border.commentBorder,
    borderWidth: 2,
    position: 'relative',
    borderRadius: 3,
    marginBottom: NEW_COMMENT_MARGIN_BOTTOM,
    marginLeft: 5,
    marginRight: 5,
    "@media print": {
      display: "none"
    },
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
  },
  joinButton: {
    marginTop: 37,
  },
  sortBy: {
    marginLeft: 8,
    marginTop: 14,
    marginBottom: 2,
    display: 'inline',
    color: theme.palette.text.secondary,
  },
})

const SubforumSubscribeOrCommentSection = ({
  tag,
  sortOptions,
  selectedSorting,
  handleSortingSelect,
  refetch,
  classes,
}: {
  tag: TagBasicInfo,
  sortOptions: Option[],
  selectedSorting: Option,
  handleSortingSelect: (option: Option) => void,
  refetch: () => void,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { flash } = useMessages();
  const { captureEvent } = useTracking()
  const updateCurrentUser = useUpdateCurrentUser()
  const { LWTooltip, Typography, CommentsNewForm, InlineSelect } = Components
  
  const isSubscribed = currentUser && currentUser.profileTagIds?.includes(tag._id)

  const onSubscribe = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      e.preventDefault();

      captureEvent('subforumSubscribeClicked', {tagId: tag._id});

      if (currentUser) {
        void updateCurrentUser({profileTagIds: [...(currentUser.profileTagIds || []), tag._id]})
      } else {
        openDialog({
          componentName: "LoginPopup",
          componentProps: {}
        });
      }
    } catch(error) {
      flash({messageString: error.message});
    }
  }

  return (
    isSubscribed ? (
      <>
        <Typography
          variant="body2"
          component='span'
          className={classes.sortBy}
        >
          <span>Sorted by <InlineSelect options={sortOptions} selected={selectedSorting} handleSelect={handleSortingSelect} /></span>
        </Typography>
        <div id="posts-thread-new-comment" className={classes.newComment}>
          <CommentsNewForm
            tag={tag}
            tagCommentType={TagCommentType.Subforum}
            formProps={{
              editorHintText: `Message...`,
            }}
            successCallback={refetch}
            type="comment"
            enableGuidelines={false}
            displayMode="minimalist" />
        </div>
      </>
    ) : (
      <div className={classNames(classes.newComment, classes.joinButton, classes.root)}>
        <LWTooltip title={`Join to gain comment access and see ${tag.name} Subforum content on the frontpage`}>
          <Button variant="contained" color="primary" className={classes.subscribeButton} onClick={onSubscribe}>
            <span className={classes.subscribeText}>{`Join`}</span>
          </Button>
        </LWTooltip>
      </div>)
    )
}

const SubforumSubscribeOrCommentSectionComponent = registerComponent('SubforumSubscribeOrCommentSection', SubforumSubscribeOrCommentSection, {styles, stylePriority: 1});

declare global {
  interface ComponentTypes {
    SubforumSubscribeOrCommentSection: typeof SubforumSubscribeOrCommentSectionComponent
  }
}
