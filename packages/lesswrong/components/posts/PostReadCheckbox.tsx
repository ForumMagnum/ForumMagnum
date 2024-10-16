import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxTwoToneIcon from '@material-ui/icons/CheckBoxTwoTone';
import { useItemsRead } from '../hooks/useRecordPostView';
import { useMutate } from '../hooks/useMutate';
import { gql } from '@apollo/client';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    cursor: "pointer",
  },
  read: {
    color: isFriendlyUI
      ? theme.palette.primary.main
      : theme.palette.primary.light,
  },
  unread: {
    color: theme.palette.grey[400],
  },
});

export const PostReadCheckbox = ({classes, post, width=12}: {
  classes: ClassesType,
  post: PostsBase,
  width?: number
}) => {
  const { LWTooltip } = Components
  const {postsRead, setPostRead} = useItemsRead();
  

  const isRead = post && ((post._id in postsRead) ? postsRead[post._id] : post.isRead)

  const { mutate } = useMutate();
  
  const handleSetIsRead = (isRead: boolean) => {
    void mutate({
      mutation: gql`
        mutation markAsReadOrUnread($postId: String, isRead: Boolean) {
          markAsReadOrUnread(postId: $postId, isRead: $isRead)
        }
      `,
      variables: {
        postId: post._id,
        isRead: isRead,
      },
      errorHandling: "flashMessageAndReturn",
    });
    setPostRead(post._id, isRead);
  }

  if (isRead) {
    return <LWTooltip title="Mark as unread">
      <CheckBoxTwoToneIcon 
        className={classNames(classes.root, classes.read)} 
        style={{width}}
        onClick={() => handleSetIsRead(false)}
      />
    </LWTooltip>
  } else {
    return <LWTooltip title="Mark as read">
      <CheckBoxOutlineBlankIcon 
        className={classNames(classes.root, classes.unread)} 
        style={{width}} 
        onClick={() => handleSetIsRead(true)}
      />
    </LWTooltip>
  }
}

const PostReadCheckboxComponent = registerComponent('PostReadCheckbox', PostReadCheckbox, {styles});

declare global {
  interface ComponentTypes {
    PostReadCheckbox: typeof PostReadCheckboxComponent
  }
}

