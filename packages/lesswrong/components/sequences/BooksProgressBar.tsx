import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "inline"
  },
  post: {
    border: theme.palette.border.normal,
    width: 12,
    height: 12,
    marginRight: 1,
    marginTop: 2,
  },
  read: {
    backgroundColor: theme.palette.primary.main,
  },
  sequence: {
    display: "flex",
    flexWrap: "wrap",
  },
  progressText: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[500],
    fontSize: "1rem",
  }
});

const BooksProgressBar = ({ book, classes }: {
  book: BookPageFragment,
  classes: ClassesType
}) => {
  const { LWTooltip, PostsPreviewTooltip } = Components;

  const sequencePosts = book.sequences.flatMap(sequence => sequence.chapters.flatMap(chapter => chapter.posts.flatMap(post => post)));
  const readPosts = sequencePosts.filter(post => post.isRead).length;
  const totalPosts = sequencePosts.length;

  const postsReadText = `${readPosts} / ${totalPosts} posts read`;

  return <div key={book._id} className={classes.root}>
    <div className={classNames(classes.sequence, classes.progressText)}>{postsReadText}</div>
    <div className={classes.sequence}>
      {
        sequencePosts.map(post => (
          <LWTooltip title={<PostsPreviewTooltip post={post}/>} tooltip={false} flip={false}>
            <Link to={postGetPageUrl(post)}>
              <div key={post._id} className={classNames(classes.post, {[classes.read]: post.isRead})} />
            </Link>
          </LWTooltip>
          ))
      }
    </div>
  </div>;
};

const BooksProgressBarComponent = registerComponent('BooksProgressBar', BooksProgressBar, { styles });

declare global {
  interface ComponentTypes {
    BooksProgressBar: typeof BooksProgressBarComponent
  }
}

