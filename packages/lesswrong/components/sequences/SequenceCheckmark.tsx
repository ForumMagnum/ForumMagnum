import React from 'react';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { registerComponent } from '../../lib/vulcan-lib';
import { useItemsRead } from '../common/withRecordPostView';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxTwoToneIcon from '@material-ui/icons/CheckBoxTwoTone';

const styles = (theme: ThemeType): JssStyles => ({
  read: {
    width: 12,
    color: forumTypeSetting.get() === "EAForum"
      ? theme.palette.primary.main
      : theme.palette.primary.light,
    marginRight: 10,
    position: "relative",
    top: -1
  },
  unread: {
    width: 12,
    color: theme.palette.grey[400],
    marginRight: 10,
    top: -1
  }
});

export const SequenceCheckmark = ({classes, post}: {
  classes: ClassesType,
  post: PostsList
}) => {
  const { postsRead: clientPostsRead } = useItemsRead();

  const isPostRead = post.isRead || clientPostsRead[post._id];

  if (isPostRead) {
    return <CheckBoxTwoToneIcon className={classes.read} />
  } else {
    return <CheckBoxOutlineBlankIcon className={classes.unread}/>
  }
}

const SequenceCheckmarkComponent = registerComponent('SequenceCheckmark', SequenceCheckmark, {styles});

declare global {
  interface ComponentTypes {
    SequenceCheckmark: typeof SequenceCheckmarkComponent
  }
}

