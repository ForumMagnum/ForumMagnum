import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxTwoToneIcon from '@material-ui/icons/CheckBoxTwoTone';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  },
  title: {
    position: "relative",
    flexGrow: 1,
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    color: theme.palette.grey[900],
    display: "flex",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 8
  },
  read: {
    width: 14,
    color: theme.palette.primary.light,
    marginRight: 10,
    position: "relative",
    top: -2
  },
  unread: {
    width: 14,
    color: theme.palette.grey[400],
    marginRight: 10,
    top: -2
  }
});

const SequencesSmallPostLink = ({classes, post}: {
  classes: ClassesType,
  post: PostsList,
}) => {
  const { LWTooltip, PostsPreviewTooltip, } = Components

  const icon = !!post.lastVisitedAt ? <CheckBoxTwoToneIcon className={classes.read} /> : <CheckBoxOutlineBlankIcon className={classes.unread}/>

  return  <div className={classes.root}>
      <LWTooltip tooltip={false} clickable={true} title={<PostsPreviewTooltip post={post}/>} placement="left-start" inlineBlock={false}>
        <Link to={postGetPageUrl(post)} className={classes.title}>
          {icon} {post.title}
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

