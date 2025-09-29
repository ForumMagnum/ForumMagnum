import classNames from 'classnames';
import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { useItemsRead } from '../hooks/useRecordPostView';
import { postProgressBoxStyles } from '../sequences/BooksProgressBar';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { forumSelect } from '../../lib/forumTypeUtils';
import PostsTooltip from "../posts/PostsPreviewTooltip/PostsTooltip";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useSuspenseQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { SuspenseWrapper } from '../common/SuspenseWrapper';
import { useCurrentUser } from '../common/withUser';

const styles = defineStyles("SpotlightStartOrContinueReading", (theme: ThemeType) => ({
  root: {
    ...(theme.isFriendlyUI && {
      [theme.breakpoints.down("xs")]: {
        marginTop: 8,
      },
    }),
    marginTop: theme.isFriendlyUI ? 0 : 4,
    minHeight: 20,
  },
  placeholder: {
  },
  boxesRoot: {
  },
  firstPost: {
    ...theme.typography.body2,
    fontSize: theme.isFriendlyUI ? 13 : "1.1rem",
    ...theme.typography.commentStyle,
    position: "relative",
    zIndex: theme.zIndexes.spotlightItemCloseButton,
    color: theme.palette.grey[500],
    '& a': {
      color: theme.palette.primary.main
    }
  },
  postProgressBox: {
    ...postProgressBoxStyles(theme),
    ...(theme.isFriendlyUI && {
      borderColor: theme.palette.text.alwaysWhite,
    }),
  },
  read: theme.isFriendlyUI
    ? {
      backgroundColor: theme.palette.text.alwaysWhite,
      border: theme.palette.text.alwaysWhite,
    }
    : {
      backgroundColor: theme.palette.primary.main,
      border: theme.palette.primary.dark,
      opacity: .4
    },
}), {
  stylePriority: -2
});

export const SpotlightStartOrContinueReadingQuery = gql(`
  query SpotlightStartOrContinueReadingQuery($spotlightId: String) {
    spotlight(input: {selector: {documentId: $spotlightId}}) {
      result {
        _id
        sequenceChapters {
          _id
          posts {
            ...PostsList
          }
        }
      }
    }
  }
`);

const SpotlightStartOrContinueReadingInner = ({spotlight}: {
  spotlight: SpotlightDisplay,
}) => {
  const { postsRead: clientPostsRead } = useItemsRead();
  
  // This query is separate from the query in DismissibleSpotlightItem because
  // when the spotlight is a sequence, the spotlight item differs based on the
  // read-status of posts in the sequence, so using a cached logged-out version
  // of the query won't work.
  const { data } = useSuspenseQuery(SpotlightStartOrContinueReadingQuery, {
    variables: {spotlightId: spotlight._id}
  });

  if (spotlight.documentType !== "Sequence") // Defensive
    return null;
  
  const chapters = data?.spotlight?.result?.sequenceChapters;
  if (!chapters) return null;
  
  const posts = chapters?.flatMap(chapter => chapter.posts ?? []) ?? []
  const readPosts = posts.filter(post => post.isRead || clientPostsRead[post._id])
  
  // Note: the firstPostUrl won't reliably generate a good reading experience for all
  // possible Collection type spotlights, although it happens to work for the existing 5 collections 
  // on LessWrong. (if the first post of a collection has a canonical sequence that's not 
  // in that collection it wouldn't provide the right 'next post')
  // But, also, the real proper fix here is to integrate continue reading here.
  const firstPost = readPosts.length === 0 && posts[0]
  
  if (!posts.length) return null;
  if (firstPost) {
    return <SpotlightStartOrContinueReadingFirstPost spotlight={spotlight} firstPost={firstPost} />
  } else {
    return <SpotlightStartOrContinueReadingCheckboxes spotlight={spotlight} posts={posts}/>
  }
}

const SpotlightStartOrContinueReadingFirstPost = ({spotlight, firstPost}: {
  spotlight: SpotlightDisplay
  firstPost: PostsList
}) => {
  const classes = useStyles(styles);
  const firstPostSequenceId = spotlight.documentId;

  const prefix = forumSelect({
    EAForum: preferredHeadingCase("Start with: "),
    default: preferredHeadingCase("First Post: ")
  });

  return <div className={classNames(classes.firstPost, classes.root)}>
    {prefix}<PostsTooltip post={firstPost}>
      <Link to={postGetPageUrl(firstPost, false, firstPostSequenceId)}>{firstPost.title}</Link>
    </PostsTooltip>
  </div>
}

const SpotlightStartOrContinueReadingCheckboxes = ({spotlight, posts}: {
  spotlight: SpotlightDisplay,
  posts: PostsList[]
}) => {
  const classes = useStyles(styles);
  const { postsRead: clientPostsRead } = useItemsRead();
  const firstPostSequenceId = spotlight.documentId;
  
  return <div className={classNames(classes.boxesRoot, classes.root)}>
    {posts.map(post => <PostsTooltip
      key={`${spotlight._id}-${post._id}`}
      post={post}
      flip={false}
      inlineBlock
    >
      <Link to={postGetPageUrl(post, false, firstPostSequenceId)}>
        <div className={classNames(classes.postProgressBox, {[classes.read]: post.isRead || clientPostsRead[post._id]})} />
      </Link>
    </PostsTooltip>
   )}
  </div>
}

const SpotlightStartOrContinueReadingFallback = ({spotlight}: {
  spotlight: SpotlightDisplay
}) => {
  const classes = useStyles(styles);
  return <div className={classNames(classes.root, classes.placeholder)}/>
}

export const SpotlightStartOrContinueReading = ({spotlight}: {
  spotlight: SpotlightDisplay,
}) => {
  return <SuspenseWrapper
    name="SpotlightStartOrContinueReading"
    fallback={<SpotlightStartOrContinueReadingFallback spotlight={spotlight} />}
  >
    <SpotlightStartOrContinueReadingInner spotlight={spotlight}/>
  </SuspenseWrapper>
}

