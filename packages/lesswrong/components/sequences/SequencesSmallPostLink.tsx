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
  checkbox: {
    position: "relative",
    top: 1,
    marginRight: 10
  }
});

const SequencesSmallPostLink = ({classes, post, sequenceId, large, placement="left-start"}: {
  classes: ClassesType,
  post: PostsList,
  sequenceId: string,
  large?: boolean,
  placement?: PopperPlacementType | undefined
}) => {
  const { LWTooltip, PostsPreviewTooltip, PostReadCheckbox } = Components

  return <div className={classNames(classes.title, {[classes.large]: large})}>
    <span className={classes.checkbox}>
      <PostReadCheckbox post={post} />
    </span>
    <LWTooltip tooltip={false} clickable={true} title={<PostsPreviewTooltip post={post} postsList/>} placement={placement} inlineBlock={false} flip>
      <Link to={postGetPageUrl(post, false, sequenceId)}>
        {post.title}
      </Link>
    </LWTooltip>
  </div>
}

const SequencesSmallPostLinkComponent = registerComponent("SequencesSmallPostLink", SequencesSmallPostLink, {styles});

declare global {
  interface ComponentTypes {
    SequencesSmallPostLink: typeof SequencesSmallPostLinkComponent
  }
}

