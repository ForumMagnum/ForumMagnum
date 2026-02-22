import classNames from 'classnames';
import { postGetLink, postGetLinkTarget } from '../../lib/collections/posts/helpers';
import { registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  root: {
        ...theme.typography.contentNotice,
        ...theme.typography.postStyle,
      },
  link: {
    color: theme.palette.primary.main,
  },
  negativeTopMargin: {
    marginTop: -14,
  }
})

const LinkPostMessage = ({post, classes, negativeTopMargin}: {
  post: PostsBase,
  classes: ClassesType<typeof styles>,
  negativeTopMargin?: boolean
}) => {
  if (!post.url)
    return null;

  return (
    <div className={classNames(classes.root, {[classes.negativeTopMargin]: negativeTopMargin})}>
      This is a linkpost for <a
        href={postGetLink(post)}
        target={postGetLinkTarget(post)}
        className={classes.link}
      >{post.url}</a>
    </div>
  );
}

export default registerComponent('LinkPostMessage', LinkPostMessage, {styles});


