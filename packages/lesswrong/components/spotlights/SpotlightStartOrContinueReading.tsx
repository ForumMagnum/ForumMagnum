import classNames from 'classnames';
import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { useItemsRead } from '../hooks/useRecordPostView';
import { postProgressBoxStyles } from '../sequences/BooksProgressBar';
import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';
import { forumSelect } from '../../lib/forumTypeUtils';
import PostsTooltip from "../posts/PostsPreviewTooltip/PostsTooltip";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';

const styles = defineStyles("SpotlightStartOrContinueReading", (theme: ThemeType) => ({
  boxesRoot: {
  },
  firstPost: {
    ...theme.typography.body2,
    fontSize: isFriendlyUI ? 13 : "1.1rem",
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
    ...(isFriendlyUI && {
      borderColor: theme.palette.text.alwaysWhite,
    }),
  },
  read: isFriendlyUI
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
          ...ChaptersFragment
        }
      }
    }
  }
`);

export const SpotlightStartOrContinueReading = ({spotlight, className}: {
  spotlight: SpotlightDisplay,
  className?: string,
}) => {
  const classes = useStyles(styles);
  const { postsRead: clientPostsRead } = useItemsRead();
  
  // This query is separate from the query in DismissibleSpotlightItem because
  // when the spotlight is a sequence, the spotlight item differs based on the
  // read-status of posts in the sequence, so using a cached logged-out version
  // of the query won't work.
  const { data } = useQuery(SpotlightStartOrContinueReadingQuery, {
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
  const firstPostSequenceId = spotlight.documentId;
  
  if (!posts.length) return null;
  const prefix = forumSelect({
    EAForum: preferredHeadingCase("Start with: "),
    default: preferredHeadingCase("First Post: ")
  });
  if (firstPost) {
    return <div className={classNames(classes.firstPost, className)}>
      {prefix}<PostsTooltip post={firstPost}>
        <Link to={postGetPageUrl(firstPost, false, firstPostSequenceId)}>{firstPost.title}</Link>
      </PostsTooltip>
    </div>
  } else {
    return <div className={classNames(classes.boxesRoot, className)}>
    {posts.map(post => (
      <PostsTooltip
        key={`${spotlight._id}-${post._id}`}
        post={post}
        flip={false}
        inlineBlock
      >
        <Link to={postGetPageUrl(post, false, firstPostSequenceId)}>
          <div className={classNames(classes.postProgressBox, {[classes.read]: post.isRead || clientPostsRead[post._id]})} />
        </Link>
      </PostsTooltip>
     ))}
  </div>
  }
}


