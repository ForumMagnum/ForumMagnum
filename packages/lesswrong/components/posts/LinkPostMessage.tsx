import { postGetLink, postGetLinkTarget } from '../../lib/collections/posts/helpers';
import React from 'react';
import classNames from 'classnames';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LinkPostMessage', (theme: ThemeType) => ({
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
}))

const LinkPostMessage = ({post, negativeTopMargin}: {
  post: PostsBase,
  negativeTopMargin?: boolean
}) => {
  const classes = useStyles(styles);

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

export default LinkPostMessage;


