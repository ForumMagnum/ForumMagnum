import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import AddBoxIcon from "@material-ui/icons/AddBox";
import { useLocation } from '../../../lib/routeUtil';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useTracking } from "../../../lib/analyticsEvents";
import { MAX_COLUMN_WIDTH } from '../../posts/PostsPage/PostsPage';
import { useCurrentUser } from '../../common/withUser';
import { useDialog } from '../../common/withDialog';
import { Link } from '../../../lib/reactRouterWrapper';
import { defaultSubforumSorting, isSubforumSorting, SubforumLayout, SubforumSorting, subforumSortingToResolverName, subforumSortingTypes } from '../../../lib/collections/tags/subforumHelpers';
import { tagPostTerms } from '../TagPage';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { TAG_POSTS_SORT_ORDER_OPTIONS } from '../../../lib/collections/tags/schema';
import startCase from 'lodash/startCase';

const styles = (theme: ThemeType): JssStyles => ({
  centralColumn: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: MAX_COLUMN_WIDTH,
  },
  newPostLink: {
    display: "flex",
    alignItems: "center",
  },
  newPostLinkHover: {
    '&:hover': {
      opacity: 0.5
    }
  },
  feedWrapper: {
    padding: "0 10px",
  },
  feedHeader: {
    display: "flex",
    marginLeft: 10,
    [theme.breakpoints.down('xs')]: {
      '& .PostsListSortDropdown-root': {
        marginRight: "0px !important",
      }
    }
  },
  feedHeaderButtons: {
    display: "flex",
    flexGrow: 1,
    columnGap: 16,
  },
  listSettingsToggle: {
    marginLeft: 16,
  },
  listSettingsContainer: {
    marginTop: 16,
  },
  newShortformContainer: {
    background: theme.palette.grey[0],
    marginTop: 16,
    padding: "0px 8px 8px 8px",
  },
  feedPostWrapper: {
    marginTop: 16,
    marginBottom: 16,
  },
  hideOnMobile: {
    [theme.breakpoints.down('xs')]: {
      display: "none"
    }
  },
  commentPermalink: {
    marginBottom: 8,
  },
  listLayout: {
    paddingTop: 16,
  }
})

const SubforumSubforumTab = ({tag, userTagRel, layout, isSubscribed, classes}: {
  tag: TagPageFragment | TagPageWithRevisionFragment,
  userTagRel?: UserTagRelDetails,
  layout: SubforumLayout,
  isSubscribed: boolean,
  classes: ClassesType,
}) => {
  const {
    CommentPermalink,
    LWTooltip,
    SectionButton,
    MixedTypeFeed,
    RecentDiscussionThread,
    CommentWithReplies,
    PostsList2,
    CommentsListCondensed,
    SubforumListSettings,
    SortButton,
    ShortformSubmitForm,
  } = Components;

  const { query } = useLocation();
  const currentUser = useCurrentUser();
  const { captureEvent } =  useTracking()
  const { openDialog } = useDialog()
  const refetchRef = useRef<null|(()=>void)>(null);
  const refetch = useCallback(() => {
    if (refetchRef.current)
      refetchRef.current();
  }, [refetchRef]);

  const [newShortformOpen, setNewShortformOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const hideIntroPost = currentUser && userTagRel && !!userTagRel?.subforumHideIntroPost
  
  const clickNewShortform = useCallback(() => {
    setNewShortformOpen(true)
    captureEvent("newShortformClicked", {tagId: tag._id, tagName: tag.name, pageSectionContext: "tagHeader"})
  }, [captureEvent, tag._id, tag.name])

  const { mutate: updateUserTagRel } = useUpdate({
    collectionName: 'UserTagRels',
    fragmentName: 'UserTagRelDetails',
  });

  const dismissIntroPost = useCallback(() => {
    if (!userTagRel) return;
    void updateUserTagRel({selector: {_id: userTagRel?._id}, data: {subforumHideIntroPost: true}})
  }, [updateUserTagRel, userTagRel])

  // if no sort order was selected, try to use the tag page's default sort order for posts
  const sortBy: SubforumSorting = (isSubforumSorting(query.sortedBy) && query.sortedBy) || (isSubforumSorting(tag.postsDefaultSortOrder) && tag.postsDefaultSortOrder) || defaultSubforumSorting;
  
  const commentNodeProps = {
    treeOptions: {
      postPage: true,
      showPostTitle: false,
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

  const shortformButton = (
    <LWTooltip
      title="Create a shortform which will appear in this subforum"
      className={classNames(classes.newPostLink, classes.newPostLinkHover)}
    >
      <SectionButton onClick={clickNewShortform}>
        <AddBoxIcon /> <span className={classes.hideOnMobile}>New</span>&nbsp;Shortform
      </SectionButton>
    </LWTooltip>
  );

  const newPostButton = (
    <LWTooltip
      title={
        currentUser
          ? `Create a post tagged with the ${startCase(
              tag.name
            )} topic — by default this will appear here and on the frontpage`
          : "You must be logged in to create a post"
      }
      className={classes.newPostLink}
    >
      <Link
        to={`/newPost?subforumTagId=${tag._id}`}
        onClick={(ev) => {
          if (!currentUser) {
            openDialog({
              componentName: "LoginPopup",
              componentProps: {},
            });
            ev.preventDefault();
          }
        }}
      >
        <SectionButton>
          <AddBoxIcon /> <span className={classes.hideOnMobile}>New</span>&nbsp;Post
        </SectionButton>
      </Link>
    </LWTooltip>
  );
  
  const feedLayoutComponent = <>
    {tag.subforumIntroPost && !hideIntroPost && (
      <div className={classes.feedPostWrapper}>
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
      </div>
    )}
    <MixedTypeFeed
      firstPageSize={15}
      pageSize={20}
      refetchRef={refetchRef}
      resolverName={`Subforum${subforumSortingToResolverName(sortBy)}Feed`}
      sortKeyType={subforumSortingTypes[sortBy]}
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
    ...tagPostTerms(tag, query),
    limit: 10
  }
  const listLayoutComponent = (
    <div className={classes.listLayout}>
      <PostsList2 terms={terms} tagId={tag._id} itemsPerPage={50} hideTagRelevance enableTotal/>
      <CommentsListCondensed
        label={"Shortforms"}
        contentType="shortform"
        terms={{
          view: "tagSubforumComments" as const,
          tagId: tag._id,
          sortBy,
        }}
        initialLimit={8}
        itemsPerPage={20}
        showTotal
      />
    </div>
  );

  const layoutComponents: Record<SubforumLayout, JSX.Element> = {
    feed: feedLayoutComponent,
    list: listLayoutComponent
  }

  return (
    <div className={classNames(classes.centralColumn, classes.feedWrapper)}>
      {query.commentId && (
        <div className={classes.commentPermalink}>
          <CommentPermalink documentId={query.commentId} />
        </div>
      )}
      <div className={classes.feedHeader}>
        <div className={classes.feedHeaderButtons}>
          {shortformButton}
          {newPostButton}
        </div>
        <LWTooltip title={`${showSettings ? "Hide" : "Show"} options for sorting and layout`} placement="top-end">
          <div
            className={classes.listSettingsToggle}
            onClick={() => {
              setShowSettings(!showSettings);
            }}
          >
            <SortButton label={<span>Sorted by {TAG_POSTS_SORT_ORDER_OPTIONS[sortBy].label}<span className={classes.hideOnMobile}>, {layout === "feed" ? "Posts Expanded" : "Posts Collapsed"}</span></span>} />
          </div>
        </LWTooltip>
      </div>
      {showSettings && (
        <div className={classes.listSettingsContainer}>
          <SubforumListSettings currentSorting={sortBy} currentLayout={layout} />
        </div>
      )}
      {newShortformOpen && (
        <div className={classes.newShortformContainer}>
          {/* FIXME: bug here where the submit and cancel buttons don't do anything the first time
              you click on them, on desktop only */}
          <ShortformSubmitForm
            prefilledProps={{
              relevantTagIds: [tag._id],
            }}
            cancelCallback={() => setNewShortformOpen(false)}
            successCallback={() => {
              setNewShortformOpen(false);
              refetch();
            }}
            noDefaultStyles
          />
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
