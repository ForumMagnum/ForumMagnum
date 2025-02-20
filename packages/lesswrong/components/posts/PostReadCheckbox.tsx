import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxTwoToneIcon from '@material-ui/icons/CheckBoxTwoTone';
import { useItemsRead } from '../hooks/useRecordPostView';
import { useNamedMutation } from '../../lib/crud/withMutation';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
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
  classes: ClassesType<typeof styles>,
  post: PostsBase,
  width?: number
}) => {
  const { LWTooltip } = Components
  const {postsRead, setPostRead} = useItemsRead();
  

  const isRead = post && ((post._id in postsRead) ? postsRead[post._id] : post.isRead)

  const {mutate: markAsReadOrUnread} = useNamedMutation<{
    postId: string, isRead: boolean,
  }>({
    name: 'markAsReadOrUnread',
    graphqlArgs: {postId: 'String', isRead: 'Boolean'},
  });
  
  const handleSetIsRead = (isRead: boolean) => {
    void markAsReadOrUnread({
      postId: post._id,
      isRead: isRead,
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

