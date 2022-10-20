import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxTwoToneIcon from '@material-ui/icons/CheckBoxTwoTone';
import { useItemsRead } from '../hooks/useRecordPostView';
import { forumTypeSetting } from '../../lib/instanceSettings';
import classNames from 'classnames';
import { PopperPlacementType } from '@material-ui/core/Popper/Popper';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    position: "relative",
    flexGrow: 1,
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    color: theme.palette.grey[900],
    display: "flex",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 6
  },
  large: {
    ...theme.typography.postsItemTitle,
    marginBottom: 10,
    marginTop: 10
  },
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

const SequencesSmallPostLink = ({classes, post, sequenceId, large, placement="left-start"}: {
  classes: ClassesType,
  post: PostsList,
  sequenceId: string,
  large?: boolean,
  placement?: PopperPlacementType | undefined
}) => {
  const { LWTooltip, PostsPreviewTooltip } = Components

  const { postsRead: clientPostsRead } = useItemsRead();

  const isPostRead = post.isRead || clientPostsRead[post._id];

  const icon = isPostRead ? <CheckBoxTwoToneIcon className={classes.read} /> : <CheckBoxOutlineBlankIcon className={classes.unread}/>

  return  <LWTooltip tooltip={false} clickable={true} title={<PostsPreviewTooltip post={post} postsList/>} placement={placement} inlineBlock={false} flip>
        <Link to={postGetPageUrl(post, false, sequenceId)} className={classNames(classes.title, {[classes.large]: large})}>
          {icon} {post.title}
        </Link>
      </LWTooltip>
}

const SequencesSmallPostLinkComponent = registerComponent("SequencesSmallPostLink", SequencesSmallPostLink, {styles});

declare global {
  interface ComponentTypes {
    SequencesSmallPostLink: typeof SequencesSmallPostLinkComponent
  }
}

