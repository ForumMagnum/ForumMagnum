import React, {useCallback} from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { Link } from '../../../lib/reactRouterWrapper';
import { useNavigation } from '../../../lib/routeUtil';
import { useGlobalKeydown } from '../../common/withGlobalKeydown';
import withErrorBoundary from '../../common/withErrorBoundary'
import { sequenceGetPageUrl } from '../../../lib/collections/sequences/helpers';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { useCurrentUser } from '../../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginLeft:-20,
    display: "flex",
    alignItems: "center",
  },
  title: {
    display: 'inline-block',
    fontSize: 22,
    verticalAlign: '-webkit-baseline-middle',
    fontFamily: theme.typography.uiSecondary.fontFamily,
    lineHeight: '24px',
    color: theme.palette.text.dim,
    ...theme.typography.smallCaps,
  }
})

const PostsTopSequencesNav = ({post, classes}: {
  post: PostSequenceNavigation,
  classes: ClassesType,
}) => {
  const { LWTooltip, SequencesHoverOver, SequencesNavigationLink } = Components 
  const { history } = useNavigation();
  const currentUser = useCurrentUser();

  const handleKey = useCallback((ev) => {
    // Only if Shift and no other modifiers
    if (ev.shiftKey && !ev.ctrlKey && !ev.altKey && !ev.metaKey) {
      // Check the targe of the event; we don't want to navigate if you're
      // trying to use Shift+Left/Right to move the cursor inside eg a comment
      // box. Apply the hotkey if the target is either document.body (nothing
      // selected) or is an <a> tag (a spurious selection because you opened
      // a link in a new tab, usually).
      if (ev.target === document.body || (ev.target && (ev.target as any).tagName === 'A')) {
        if (ev.keyCode == 37) { // Left
          if (post.prevPost)
            history.push(postGetPageUrl(post.prevPost, false, post.prevPost.sequence?._id));
        } else if (ev.keyCode == 39) { // Right
          if (post.nextPost)
            history.push(postGetPageUrl(post.nextPost, false, post.nextPost.sequence?._id));
        }
      }
    }
  }, [post, history]);
  useGlobalKeydown(handleKey);

  if (!post?.sequence)
    return null;

  if (post.sequence.draft && (!currentUser || currentUser._id!=post.sequence.userId) && !currentUser?.isAdmin) {
    return null;
  }
  
  return (
    <div className={classes.root}>
      <SequencesNavigationLink
        post={post.prevPost}
        direction="left" />

      <LWTooltip tooltip={false} title={<SequencesHoverOver sequence={post.sequence} />} clickable={true}>
        <div className={classes.title}>
          {post.sequence.draft && "[Draft] "}
          <Link to={sequenceGetPageUrl(post.sequence)}>{ post.sequence.title }</Link>
        </div>
      </LWTooltip>

      <SequencesNavigationLink
        post={post.nextPost}
        direction="right" />
    </div>
  )
}

const PostsTopSequencesNavComponent = registerComponent(
  'PostsTopSequencesNav', PostsTopSequencesNav, {
    styles,
    hocs: [withErrorBoundary]
  }
);

declare global {
  interface ComponentTypes {
    PostsTopSequencesNav: typeof PostsTopSequencesNavComponent
  }
}
