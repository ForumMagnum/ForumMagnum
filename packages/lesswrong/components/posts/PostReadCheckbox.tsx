import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import CheckBoxOutlineBlankIcon from '@/lib/vendor/@material-ui/icons/src/CheckBoxOutlineBlank';
import CheckBoxTwoToneIcon from '@/lib/vendor/@material-ui/icons/src/CheckBoxTwoTone';
import { useItemsRead } from '../hooks/useRecordPostView';
import classNames from 'classnames';
import LWTooltip from "../common/LWTooltip";
import { useMutation } from "@apollo/client/react";
import { gql } from '@/lib/generated/gql-codegen';

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
  },
  read: {
    color: theme.isFriendlyUI
      ? theme.palette.primary.main
      : theme.palette.primary.light,
  },
  unread: {
    color: theme.palette.grey[400],
  },
});

export const PostReadCheckbox = ({classes, post, width=12}: {
  classes: ClassesType<typeof styles>,
  post: PostsBase,
  width?: number
}) => {
  const {postsRead, setPostRead} = useItemsRead();
  

  const isRead = post && ((post._id in postsRead) ? postsRead[post._id] : post.isRead)

  const [markAsReadOrUnread] = useMutation(gql(`
    mutation markAsReadOrUnread($postId: String, $isRead: Boolean) {
      markAsReadOrUnread(postId: $postId, isRead: $isRead)
    }
  `));
  
  const handleSetIsRead = (isRead: boolean) => {
    void markAsReadOrUnread({
      variables: {
        postId: post._id,
        isRead: isRead,
      }
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

export default registerComponent('PostReadCheckbox', PostReadCheckbox, {styles});



