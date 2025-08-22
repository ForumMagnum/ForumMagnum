import React, {useCallback} from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useGlobalKeydown } from '../../common/withGlobalKeydown';
import withErrorBoundary from '../../common/withErrorBoundary'
import { sequenceGetPageUrl } from '../../../lib/collections/sequences/helpers';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { useCurrentUser } from '../../common/withUser';
import { Link } from "../../../lib/reactRouterWrapper";
import { useNavigate } from "../../../lib/routeUtil";
import classNames from 'classnames';
import { isFriendlyUI } from '@/themes/forumTheme';
import SequencesTooltip from "../../sequences/SequencesTooltip";
import SequencesNavigationLink from "../../sequences/SequencesNavigationLink";

export const darkGreyAlpha = .7

export const titleStyles = (theme: ThemeType) => ({
  display: 'inline-block',
  fontSize: 22,
  verticalAlign: '-webkit-baseline-middle',
  fontFamily: theme.typography.uiSecondary.fontFamily,
  lineHeight: '24px',
  color: theme.palette.text.dim,
  ...theme.typography.smallCaps,
})

const styles = (theme: ThemeType) => ({
  root: {
    marginLeft:-20,
    display: "flex",
    alignItems: "center",
    
    ...(isFriendlyUI && {
      marginBottom: -8,
    }),
  },
  title: {
    ...titleStyles(theme),
    
    ...(isFriendlyUI && {
      textTransform: 'uppercase',
      fontSize: 18,
      color: theme.palette.greyAlpha(0.7),
      fontWeight: 500,
    }),
    ...(isFriendlyUI && theme.dark && {
      color: theme.palette.icon.dim,
    }),
  },
  blackText: {
    '&&': {
      color: theme.palette.greyAlpha(darkGreyAlpha),
    }
  }
})

const PostsTopSequencesNav = ({post, classes, blackText}: {
  post: PostSequenceNavigation,
  classes: ClassesType<typeof styles>,
  blackText?: boolean
}) => {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();

  const handleKey = useCallback((ev: KeyboardEvent) => {
    // Only if Shift and no other modifiers
    if (ev.shiftKey && !ev.ctrlKey && !ev.altKey && !ev.metaKey) {
      // Check the targe of the event; we don't want to navigate if you're
      // trying to use Shift+Left/Right to move the cursor inside eg a comment
      // box. Apply the hotkey if the target is either document.body (nothing
      // selected) or is an <a> tag (a spurious selection because you opened
      // a link in a new tab, usually).
      if (ev.target === document.body || (ev.target && (ev.target as any).tagName === 'A')) {
        if (ev.keyCode === 37) { // Left
          if (post.prevPost)
            navigate(postGetPageUrl(post.prevPost, false, post.prevPost.sequence?._id));
        } else if (ev.keyCode === 39) { // Right
          if (post.nextPost)
            navigate(postGetPageUrl(post.nextPost, false, post.nextPost.sequence?._id));
        }
      }
    }
  }, [navigate, post]);
  useGlobalKeydown(handleKey);

  if (!post?.sequence)
    return null;

  if (post.sequence.draft && (!currentUser || currentUser._id!==post.sequence.userId) && !currentUser?.isAdmin) {
    return null;
  }
  
  return (
    <div className={classes.root}>
      <SequencesNavigationLink
        post={post.prevPost}
        direction="left" />

      <SequencesTooltip sequence={post.sequence}>
        <div className={classNames(classes.title, {[classes.blackText]: blackText})}>
          {post.sequence.draft && "[Draft] "}
          <Link to={sequenceGetPageUrl(post.sequence)}>{ post.sequence.title }</Link>
        </div>
      </SequencesTooltip>

      <SequencesNavigationLink
        post={post.nextPost}
        direction="right" />
    </div>
  )
}

export default registerComponent(
  'PostsTopSequencesNav', PostsTopSequencesNav, {
    styles,
    hocs: [withErrorBoundary]
  }
);


