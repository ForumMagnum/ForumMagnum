import React, { useCallback, useRef } from 'react';
import { useLocation } from '../../../lib/routeUtil';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { MAX_COLUMN_WIDTH } from '../../posts/PostsPage/PostsPage';
import { useCurrentUser } from '../../common/withUser';
import { defaultSubforumSorting, SubforumSorting, subforumSortingToResolverName, subforumSortingTypes } from '../../../lib/collections/tags/subforumHelpers';
import { tagPostTerms } from '../TagPage';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { TAG_POSTS_SORT_ORDER_OPTIONS } from '../../../lib/collections/tags/schema';
import difference from 'lodash/fp/difference';
import { PostsLayout } from '../../../lib/collections/posts/dropdownOptions';

const styles = (theme: ThemeType): JssStyles => ({
  centralColumn: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: MAX_COLUMN_WIDTH,
  },
  feedHeader: {
    display: "flex",
    justifyContent: "space-between",
    [theme.breakpoints.down('xs')]: {
      '& .PostsListSortDropdown-root': {
        marginRight: "0px !important",
      }
    }
  },
  newShortformContainer: {
    background: theme.palette.grey[0],
    marginTop: 16,
    padding: "0px 8px 8px 8px",
  },
  shortformComment: {
    '&&': {
      marginTop: 0,
      marginBottom: 16,
    }
  },
  centerChild: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  feedPostWrapper: {
    marginTop: 8,
    marginBottom: 8,
  },
  commentPermalink: {
    marginBottom: 8,
  },
  listLayout: {
    paddingTop: 8,
  }
})

const SubforumSubforumTab = ({
  tag,
  userTagRel,
  layout,
  newShortformOpen,
  setNewShortformOpen,
  classes
}: {
  tag: TagPageFragment | TagPageWithRevisionFragment,
  userTagRel?: UserTagRelDetails,
  layout: PostsLayout,
  newShortformOpen: boolean,
  setNewShortformOpen: (open: boolean) => void,
  classes: ClassesType,
}) => {
  const {
    CommentPermalink,
    MixedTypeFeed,
    RecentDiscussionThread,
    CommentWithReplies,
    PostsList2,
    CommentsListCondensed,
    ShortformSubmitForm,
    WrappedLoginForm,
    PostsListSortDropdown,
    PostsLayoutDropdown,
  } = Components;

  const { query } = useLocation();
  const currentUser = useCurrentUser();
  const refetchRef = useRef<null|(()=>void)>(null);
  const refetch = useCallback(() => {
    if (refetchRef.current)
      refetchRef.current();
  }, [refetchRef]);

  const hideIntroPost = currentUser && userTagRel && !!userTagRel?.subforumHideIntroPost

  const { mutate: updateUserTagRel } = useUpdate({
    collectionName: 'UserTagRels',
    fragmentName: 'UserTagRelDetails',
  });

  const dismissIntroPost = useCallback(() => {
    if (!userTagRel) return;
    void updateUserTagRel({selector: {_id: userTagRel?._id}, data: {subforumHideIntroPost: true}})
  }, [updateUserTagRel, userTagRel])

  const excludeSorting = layout === "card" ? ["relevance", "topAdjusted"] : []
  const sortByOptions = difference(Object.keys(TAG_POSTS_SORT_ORDER_OPTIONS), excludeSorting)
  // if no sort order was selected, try to use the tag page's default sort order for posts
  const sortBy: CommentSortingMode = (
    (sortByOptions.includes(query.sortedBy) && query.sortedBy)
    || (sortByOptions.includes(tag.postsDefaultSortOrder) && tag.postsDefaultSortOrder)
    || defaultSubforumSorting
  ) as CommentSortingMode;
  
  const commentNodeProps = {
    treeOptions: {
      postPage: true,
      refetch,
      tag,
      disableGuidelines: true,
    },
    startThreadTruncated: true,
    isChild: false,
    displayMode: "minimalist" as const,
  };
  const maxAgeHours = 18;
  const commentsLimit = 3;
  
  const cardLayoutComponent = <>
    {tag.subforumIntroPost && !hideIntroPost && (
      <div className={classes.feedPostWrapper}>
        <RecentDiscussionThread
          key={tag.subforumIntroPost._id}
          post={{ ...tag.subforumIntroPost, topLevelCommentCount: 0, recentComments: [] }}
          comments={[]}
          maxLengthWords={50}
          refetch={refetch}
          smallerFonts
          dismissCallback={dismissIntroPost}
          isSubforumIntroPost
        />
      </div>
    )}
    <MixedTypeFeed
      firstPageSize={15}
      pageSize={20}
      refetchRef={refetchRef}
      // type is guaranteed to be SubforumSorting by the `sortByOptions` logic above
      resolverName={`Subforum${subforumSortingToResolverName(sortBy as SubforumSorting)}Feed`}
      sortKeyType={(subforumSortingTypes as AnyBecauseTodo)[sortBy]}
      resolverArgs={{
        tagId: "String!",
        af: "Boolean",
      }}
      resolverArgsValues={{
        tagId: tag._id,
        af: false,
      }}
      fragmentArgs={{
        maxAgeHours: "Int",
        commentsLimit: "Int",
      }}
      fragmentArgsValues={{
        maxAgeHours,
        commentsLimit,
      }}
      renderers={{
        tagSubforumPosts: {
          fragmentName: "PostsRecentDiscussion",
          render: (post: PostsRecentDiscussion) => {
            // Remove the intro post from the feed IFF it has not been dismissed from the top
            return !(post._id === tag.subforumIntroPost?._id && !hideIntroPost) && (
              <div className={classes.feedPostWrapper}>
                <RecentDiscussionThread
                  key={post._id}
                  post={{ ...post }}
                  comments={post.recentComments}
                  commentTreeOptions={{forceSingleLine: true}}
                  maxLengthWords={50}
                  refetch={refetch}
                  smallerFonts
                />
              </div>
            );
          },
        },
        tagSubforumComments: {
          fragmentName: "CommentWithRepliesFragment",
          render: (comment: CommentWithRepliesFragment) => (
            <CommentWithReplies
              key={comment._id}
              comment={comment}
              commentNodeProps={commentNodeProps}
              initialMaxChildren={5}
              className={classes.shortformComment}
            />
          ),
        },
        tagSubforumStickyComments: {
          fragmentName: "StickySubforumCommentFragment",
          render: (comment: CommentWithRepliesFragment) => (
            <CommentWithReplies
              key={comment._id}
              comment={{ ...comment, isPinnedOnProfile: true }}
              commentNodeProps={{
                ...commentNodeProps,
                showPinnedOnProfile: true,
                treeOptions: {
                  ...commentNodeProps.treeOptions,
                  showPostTitle: true,
                },
              }}
              initialMaxChildren={3}
              startExpanded={false}
            />
          ),
        },
      }}
    />
  </>;

  const terms = {
    ...tagPostTerms(tag, {...query, sortedBy: sortBy}),
    limit: 10
  }
  const listLayoutComponent = (
    <div className={classes.listLayout}>
      <PostsList2 terms={terms} tagId={tag._id} itemsPerPage={50} hideTagRelevance enableTotal/>
      <CommentsListCondensed
        label="Quick takes"
        terms={{
          view: "tagSubforumComments" as const,
          tagId: tag._id,
          sortBy,
        }}
        initialLimit={8}
        itemsPerPage={20}
        showTotal
        hideTag
      />
    </div>
  );

  const layoutComponents: Record<PostsLayout, JSX.Element> = {
    card: cardLayoutComponent,
    list: listLayoutComponent
  }

  return (
    <div className={classes.centralColumn}>
      {query.commentId && (
        <div className={classes.commentPermalink}>
          <CommentPermalink documentId={query.commentId} />
        </div>
      )}
      <div className={classes.feedHeader}>
        <PostsListSortDropdown value={sortBy} options={sortByOptions}/>
        <PostsLayoutDropdown value={layout} />
      </div>
      {newShortformOpen && (
        <div className={classes.newShortformContainer}>
          {/* FIXME: bug here where the submit and cancel buttons don't do anything the first time
              you click on them, on desktop only */}
          {currentUser ? <ShortformSubmitForm
            prefilledProps={{
              relevantTagIds: [tag._id],
            }}
            cancelCallback={() => setNewShortformOpen(false)}
            successCallback={() => {
              setNewShortformOpen(false);
              refetch();
            }}
            noDefaultStyles
          /> : <div className={classes.centerChild}>
            <WrappedLoginForm />
          </div>}
        </div>
      )}
      {layoutComponents[layout]}
    </div>
  );
}

const SubforumSubforumTabComponent = registerComponent(
  'SubforumSubforumTab', SubforumSubforumTab, {styles}
);

declare global {
  interface ComponentTypes {
    SubforumSubforumTab: typeof SubforumSubforumTabComponent
  }
}
