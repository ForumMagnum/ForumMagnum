import React, { useCallback, useRef } from 'react';
import { useLocation } from '../../../lib/routeUtil';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { MAX_COLUMN_WIDTH } from '@/components/posts/PostsPage/constants';
import { useCurrentUser } from '../../common/withUser';
import { defaultSubforumSorting, SubforumSorting, subforumSortingToResolverName, subforumSortingTypes } from '../../../lib/collections/tags/subforumHelpers';
import { tagPostTerms } from '../TagPageUtils';
import { getTagPostsSortOrderOptions } from "@/lib/collections/tags/helpers";
import difference from 'lodash/fp/difference';
import { PostsLayout } from '../../../lib/collections/posts/dropdownOptions';
import { useMutation } from '@apollo/client/react';
import { ObservableQuery } from '@apollo/client';
import CommentPermalink from "../../comments/CommentPermalink";
import { MixedTypeFeed } from "../../common/MixedTypeFeed";
import RecentDiscussionThread from "../../recentDiscussion/RecentDiscussionThread";
import CommentWithReplies from "../../comments/CommentWithReplies";
import PostsList2 from "../../posts/PostsList2";
import CommentsListCondensed from "../../common/CommentsListCondensed";
import ShortformSubmitForm from "../../shortform/ShortformSubmitForm";
import LoginForm from "../../users/LoginForm";
import PostsListSortDropdown from "../../posts/PostsListSortDropdown";
import PostsLayoutDropdown from "../../posts/PostsLayoutDropdown";
import { gql } from "@/lib/generated/gql-codegen";
import { SubforumFeedQueries } from '@/components/common/feeds/feedQueries';
import { AnalyticsContext } from '../../../lib/analyticsEvents';

const UserTagRelDetailsUpdateMutation = gql(`
  mutation updateUserTagRelSubforumSubforumTab($selector: SelectorInput!, $data: UpdateUserTagRelDataInput!) {
    updateUserTagRel(selector: $selector, data: $data) {
      data {
        ...UserTagRelDetails
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
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
    paddingTop: 2,
    borderRadius: theme.borderRadius.default,
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
  classes: ClassesType<typeof styles>,
}) => {
  const { query } = useLocation();
  const currentUser = useCurrentUser();
  const refetchRef = useRef<null|ObservableQuery['refetch']>(null);
  const refetch = useCallback(() => {
    if (refetchRef.current)
      void refetchRef.current();
  }, [refetchRef]);

  const hideIntroPost = currentUser && userTagRel && !!userTagRel?.subforumHideIntroPost

  const [updateUserTagRel] = useMutation(UserTagRelDetailsUpdateMutation);

  const dismissIntroPost = useCallback(() => {
    if (!userTagRel) return;
    void updateUserTagRel({
      variables: {
        selector: { _id: userTagRel?._id },
        data: { subforumHideIntroPost: true }
      }
    })
  }, [updateUserTagRel, userTagRel])

  const excludeSorting = layout === "card" ? ["relevance", "topAdjusted"] : []
  const sortByOptions = difference(Object.keys(getTagPostsSortOrderOptions()), excludeSorting)
  // if no sort order was selected, try to use the tag page's default sort order for posts
  const sortBy: CommentSortingMode = (
    (sortByOptions.includes(query.sortedBy) && query.sortedBy)
    || (sortByOptions.includes(tag.postsDefaultSortOrder ?? '') && tag.postsDefaultSortOrder)
    || defaultSubforumSorting
  ) as CommentSortingMode;
  
  const commentNodeProps = {
    treeOptions: {
      postPage: true,
      refetch,
      tag,
    },
    startThreadTruncated: true,
    isChild: false,
    enableGuidelines: false,
    displayMode: "minimalist" as const,
  };
  const maxAgeHours = 18;
  const commentsLimit = 3;

  const feedQuery = SubforumFeedQueries[`Subforum${subforumSortingToResolverName(sortBy as SubforumSorting)}Feed`];
  
  const cardLayoutComponent = <>
    {tag.subforumIntroPost && !hideIntroPost && (
      <div className={classes.feedPostWrapper}>
        <AnalyticsContext pageSubSectionContext='recentDiscussionThread' feedCardIndex={0}>
        <RecentDiscussionThread
          key={tag.subforumIntroPost._id}
          post={{ ...tag.subforumIntroPost, recentComments: [] }}
          comments={[]}
          maxLengthWords={50}
          refetch={refetch}
          smallerFonts
          dismissCallback={dismissIntroPost}
          isSubforumIntroPost
        />
        </AnalyticsContext>
      </div>
    )}
    <MixedTypeFeed
      query={feedQuery}
      firstPageSize={15}
      pageSize={20}
      refetchRef={refetchRef}
      variables={{
        tagId: tag._id,
        af: false,
        maxAgeHours,
        commentsLimit,
      }}
      renderers={{
        tagSubforumPosts: {
          render: (post: PostsRecentDiscussion, index: number) => {
            // Remove the intro post from the feed IFF it has not been dismissed from the top
            return !(post._id === tag.subforumIntroPost?._id && !hideIntroPost) && (
              <div className={classes.feedPostWrapper}>
                <AnalyticsContext pageSubSectionContext='recentDiscussionThread' feedCardIndex={index}>
                <RecentDiscussionThread
                  key={post._id}
                  post={{ ...post }}
                  comments={post.recentComments ?? undefined}
                  commentTreeOptions={{forceSingleLine: true}}
                  maxLengthWords={50}
                  refetch={refetch}
                  smallerFonts
                />
                </AnalyticsContext>
              </div>
            );
          },
        },
        tagSubforumComments: {
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
    ...tagPostTerms(tag),
    ...(query.sortedBy ? {sortedBy: query.sortedBy as PostSortingModeWithRelevanceOption} : {}),
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

  const layoutComponents: Record<PostsLayout, React.JSX.Element> = {
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
            hideCloseButton
          /> : <div className={classes.centerChild}>
            <LoginForm />
          </div>}
        </div>
      )}
      {layoutComponents[layout]}
    </div>
  );
}

export default registerComponent(
  'SubforumSubforumTab', SubforumSubforumTab, {styles}
);


