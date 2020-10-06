import React, { PureComponent } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { Link } from '../../../lib/reactRouterWrapper';
import { withNavigation } from '../../../lib/routeUtil';
import withGlobalKeydown from '../../common/withGlobalKeydown';
import withErrorBoundary from '../../common/withErrorBoundary'
import { Sequences } from '../../../lib/collections/sequences/collection';
import { Posts } from '../../../lib/collections/posts/collection';

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
    fontVariant: 'small-caps',
    fontFamily: theme.typography.uiSecondary.fontFamily,
    lineHeight: '24px',
    color: 'rgba(0,0,0,0.5)',
  }
})

interface ExternalProps {
  post: PostSequenceNavigation,
}
interface PostsTopSequencesNavProps extends ExternalProps, WithNavigationProps, WithGlobalKeydownProps, WithStylesProps {
}

class PostsTopSequencesNav extends PureComponent<PostsTopSequencesNavProps>
{
  componentDidMount() {
    this.props.addKeydownListener(this.handleKey);
  }

  handleKey = (ev) => {
    const { history, post } = this.props;

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
            history.push(Posts.getPageUrl(post.prevPost, false, post.prevPost.sequence?._id));
        } else if (ev.keyCode == 39) { // Right
          if (post.nextPost)
            history.push(Posts.getPageUrl(post.nextPost, false, post.nextPost.sequence?._id));
        }
      }
    }
  }

  render() {
    const { post, classes } = this.props;

    if (!post?.sequence)
      return null;

    return (
      <div className={classes.root}>
        <Components.SequencesNavigationLink
          post={post.prevPost}
          direction="left" />

        <div className={classes.title}>
          <Link to={Sequences.getPageUrl(post.sequence)}>{ post.sequence.title }</Link>
        </div>

        <Components.SequencesNavigationLink
          post={post.nextPost}
          direction="right" />
      </div>
    )
  }
}

const PostsTopSequencesNavComponent = registerComponent<ExternalProps>(
  'PostsTopSequencesNav', PostsTopSequencesNav, {
    styles,
    hocs: [withNavigation, withGlobalKeydown, withErrorBoundary]
  }
);

declare global {
  interface ComponentTypes {
    PostsTopSequencesNav: typeof PostsTopSequencesNavComponent
  }
}
