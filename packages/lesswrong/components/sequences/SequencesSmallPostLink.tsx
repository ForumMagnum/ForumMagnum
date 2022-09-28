import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';

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
  }
});

const SequencesSmallPostLink = ({classes, post, sequenceId}: {
  classes: ClassesType,
  post: PostsList,
  sequenceId: string
}) => {
  const { LWTooltip, PostsPreviewTooltip, SequencesCheckmark } = Components


  return  <LWTooltip tooltip={false} clickable={true} title={<PostsPreviewTooltip post={post} postsList/>} placement="left-start" inlineBlock={false}>
        <Link to={postGetPageUrl(post, false, sequenceId)} className={classes.title}>
          <SequencesCheckmark post={post}/> {post.title}
        </Link>
      </LWTooltip>
}

const SequencesSmallPostLinkComponent = registerComponent("SequencesSmallPostLink", SequencesSmallPostLink, {styles});

declare global {
  interface ComponentTypes {
    SequencesSmallPostLink: typeof SequencesSmallPostLinkComponent
  }
}

