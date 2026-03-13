import { registerComponent } from '../../lib/vulcan-lib/components';
import { postGetLink, postGetLinkTarget } from '../../lib/collections/posts/helpers';
import React from 'react';
import classNames from 'classnames';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('LinkPostMessage', (theme: ThemeType) => ({
  root: theme.isFriendlyUI ? {
    fontFamily: theme.palette.fonts.sansSerifStack,
    wordBreak: 'break-word',
    width: '100%',
    padding: 16,
    marginBottom: 18,
    backgroundColor: theme.palette.grey[100],
    color: theme.palette.grey[1000],
    boxSizing: 'border-box',
    borderRadius: theme.borderRadius.default,
    fontSize: 14,
    lineHeight: "21px",
  } : {
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

export default registerComponent('LinkPostMessage', LinkPostMessage, {styles});


