import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import classNames from 'classnames';
import { useItemsRead } from '../hooks/useRecordPostView';
import { isFriendlyUI } from '../../themes/forumTheme';

export const postProgressBoxStyles = (theme: ThemeType) => ({
  border: theme.palette.border.normal,
  borderRadius: 2,
  width: 12,
  height: 12,
  marginRight: 1,
  marginTop: 2,
})

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: 16
  },
  postProgressBox: {
    ...postProgressBoxStyles(theme)
  },
  read: {
    ...(
      isFriendlyUI
        ? {
          backgroundColor: theme.palette.primary.main,
          border: theme.palette.primary.dark,
        }
        : {
          backgroundColor: theme.palette.primary.light,
          border: theme.palette.primary.main,
        }
    ),
    opacity: .6
  },
  bookProgress: {
    display: "flex",
    flexWrap: "wrap",
  },
  progressText: {
    marginTop: 12,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[500],
    fontSize: "1rem",
  },
  loginText: {
    color: theme.palette.primary.main,
    marginLeft: 12,
    fontSize: "1rem"
  }
});

const WORDS_PER_MINUTE = 300;
const WORDS_PER_HOUR = WORDS_PER_MINUTE * 60;
const WORDS_PER_PAGE = 500;

const BooksProgressBar = ({ book, classes }: {
  book: BookPageFragment,
  classes: ClassesType<typeof styles>
}) => {
  const { LWTooltip, PostsTooltip, LoginToTrack } = Components;

  const { postsRead: clientPostsRead } = useItemsRead();

  const bookPosts = book.sequences.flatMap(sequence => sequence.chapters.flatMap(chapter => chapter.posts));
  // Check whether the post is marked as read either on the server or in the client-side context
  const readPosts = bookPosts.filter(post => post.isRead || clientPostsRead[post._id]);
  const totalPosts = bookPosts.length;

  const postsReadText = `${readPosts.length} / ${totalPosts} posts read`;
  const totalWordCount = bookPosts.reduce((i, post) => i + (post.contents?.wordCount || 0), 0)
  const readTime = totalWordCount > WORDS_PER_HOUR ? `${(totalWordCount/WORDS_PER_HOUR).toFixed(1)} hour` : `${Math.round(totalWordCount/WORDS_PER_MINUTE)} min`
  const postsReadTooltip = <div>
    <div>{totalWordCount.toLocaleString()} words, {Math.round(totalWordCount / WORDS_PER_PAGE)} pages</div>
    <div>Approximately {readTime} read</div>
  </div>

  if (book.hideProgressBar) return null

  return <div key={book._id} className={classes.root}>
    <div className={classes.bookProgress}>
      {
        bookPosts.map(post => (
          <PostsTooltip post={post} key={post._id}>
            <Link to={postGetPageUrl(post)}>
              <div className={classNames(classes.postProgressBox, {[classes.read]: post.isRead || clientPostsRead[post._id]})} />
            </Link>
          </PostsTooltip>
        ))
      }
    </div>
    <div className={classes.progressText}>
      <LWTooltip title={postsReadTooltip}>{postsReadText}</LWTooltip>
      <LoginToTrack className={classes.loginText}>
        log in to track progress
      </LoginToTrack>
    </div>
  </div>;
};

const BooksProgressBarComponent = registerComponent('BooksProgressBar', BooksProgressBar, { styles });

declare global {
  interface ComponentTypes {
    BooksProgressBar: typeof BooksProgressBarComponent
  }
}

