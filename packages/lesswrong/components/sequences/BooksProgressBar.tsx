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
import { PostsSequenceMetadataQuery } from './queries';

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

  const bookPostIds = book.sequences.flatMap(sequence => sequence.chapters.flatMap(chapter => chapter.postIds));
  const preloadedBookPosts = book.sequences.flatMap(sequence => sequence.chapters.flatMap(chapter => chapter.posts));

  // We're going through a lot of effort to not fetch revisions during the initial query,
  // since that makes loading Collection pages horribly slow.  So we fetch the posts with
  // revisions inside of a suspense boundary.
  const { data, loading: postsLoading } = useQuery(PostsSequenceMetadataQuery, {
    variables: { selector: { default: { exactPostIds: bookPostIds } } },
    fetchPolicy: 'cache-first',
  });

  const bookPosts = useMemo(() => data?.posts?.results ?? [], [data]);

  // Check whether the post is marked as read either on the server or in the client-side context
  const readPosts = preloadedBookPosts.filter(post => post.isRead || clientPostsRead[post._id]);
  const totalPosts = preloadedBookPosts.length;

  const postsReadText = `${readPosts.length} / ${totalPosts} posts read`;
  const totalWordCount = bookPosts.reduce((i, post) => i + (post.contents?.wordCount || 0), 0)
  const readTime = totalWordCount > WORDS_PER_HOUR ? `${(totalWordCount/WORDS_PER_HOUR).toFixed(1)} hour` : `${Math.round(totalWordCount/WORDS_PER_MINUTE)} min`
  const postsReadTooltip = <div>
    <div>{totalWordCount.toLocaleString()} words, {Math.round(totalWordCount / WORDS_PER_PAGE)} pages</div>
    <div>Approximately {readTime} read</div>
  </div>

  const postsForBoxes: (PostsList | ChapterPostSlim)[] = useMemo(() => postsLoading
    ? preloadedBookPosts
    // Order the loaded posts in the same order as preloaded posts, by id; by default they'll be in the wrong order
    : [...bookPosts].sort((a, b) => preloadedBookPosts.findIndex(p => p._id === a._id) - preloadedBookPosts.findIndex(p => p._id === b._id)),
  [postsLoading, preloadedBookPosts, bookPosts]);

  if (book.hideProgressBar) return null

  return <div key={book._id} className={classes.root}>
    <div className={classes.bookProgress}>
      {postsForBoxes.map(post => (
        <PostsTooltip
          {...('contents' in post ? { post } : { postId: post._id })}
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



