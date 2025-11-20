import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useMemo } from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import classNames from 'classnames';
import { useItemsRead } from '../hooks/useRecordPostView';
import LWTooltip from "../common/LWTooltip";
import PostsTooltip from "../posts/PostsPreviewTooltip/PostsTooltip";
import LoginToTrack from "./LoginToTrack";
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from "@/lib/generated/gql-codegen";

const GET_BOOK_WORD_COUNT = gql(`
  query GetBookWordCount($bookId: String!) {
    getBookWordCount(bookId: $bookId)
  }
`);

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
      theme.isFriendlyUI
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
  const { postsRead: clientPostsRead } = useItemsRead();

  const preloadedBookPosts = book.sequences.flatMap(sequence => sequence.chapters.flatMap(chapter => chapter.posts));

  // We're going through a lot of effort to not fetch revisions during the initial query,
  // since that makes loading Collection pages horribly slow.  So we fetch the word count
  // with a custom query inside of a suspense boundary.
  const { data } = useQuery(GET_BOOK_WORD_COUNT, {
    variables: { bookId: book._id },
    fetchPolicy: 'cache-first',
  });

  const totalWordCount = data?.getBookWordCount ?? 0;

  // Check whether the post is marked as read either on the server or in the client-side context
  const readPosts = preloadedBookPosts.filter(post => post.isRead || clientPostsRead[post._id]);
  const totalPosts = preloadedBookPosts.length;

  const postsReadText = `${readPosts.length} / ${totalPosts} posts read`;
  const readTime = totalWordCount > WORDS_PER_HOUR ? `${(totalWordCount/WORDS_PER_HOUR).toFixed(1)} hour` : `${Math.round(totalWordCount/WORDS_PER_MINUTE)} min`
  const postsReadTooltip = <div>
    <div>{totalWordCount.toLocaleString()} words, {Math.round(totalWordCount / WORDS_PER_PAGE)} pages</div>
    <div>Approximately {readTime} read</div>
  </div>

  if (book.hideProgressBar) return null

  return <div key={book._id} className={classes.root}>
    <div className={classes.bookProgress}>
      {preloadedBookPosts.map(post => (
        <PostsTooltip
          postId={post._id}
          preload="on-screen"
          key={post._id}
        >
          <Link to={postGetPageUrl(post)}>
            <div className={classNames(classes.postProgressBox, {[classes.read]: post.isRead || clientPostsRead[post._id]})} />
          </Link>
        </PostsTooltip>
      ))}
    </div>
    <div className={classes.progressText}>
      <LWTooltip title={postsReadTooltip}>{postsReadText}</LWTooltip>
      <LoginToTrack className={classes.loginText}>
        log in to track progress
      </LoginToTrack>
    </div>
  </div>;
};

export default registerComponent('BooksProgressBar', BooksProgressBar, { styles });



