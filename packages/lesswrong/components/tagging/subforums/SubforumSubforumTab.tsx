import classNames from 'classnames';
import React, { useCallback, useRef } from 'react';
import AddBoxIcon from "@material-ui/icons/AddBox";
import { useLocation } from '../../../lib/routeUtil';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useTracking } from "../../../lib/analyticsEvents";
import { MAX_COLUMN_WIDTH } from '../../posts/PostsPage/PostsPage';
import { useCurrentUser } from '../../common/withUser';
import { useDialog } from '../../common/withDialog';
import { Link } from '../../../lib/reactRouterWrapper';
import { defaultSubforumSorting, isSubforumSorting, SubforumSorting, subforumSortingToResolverName, subforumSortingTypes } from '../../../lib/collections/tags/subforumHelpers';
import { tagPostTerms } from '../TagPage';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { TAG_POSTS_SORT_ORDER_OPTIONS } from '../../../lib/collections/tags/schema';
import startCase from 'lodash/startCase';
import { difference } from 'lodash/fp';
import { PostsLayout } from '../../../lib/collections/posts/dropdownOptions';

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
  feedHeader: {
    display: "flex",
    justifyContent: "space-between",
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
  shortformComment: {
    '&&': {
      marginTop: 0,
      marginBottom: 32,
    }
  },
  centerChild: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
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
    WrappedLoginForm,
    PostsListSortDropdown,
    PostsLayoutDropdown,
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

  // const [showSettings, setShowSettings] = useState(false)
  const hideIntroPost = currentUser && userTagRel && !!userTagRel?.subforumHideIntroPost
  
  const clickNewShortform = useCallback(() => {
    setNewShortformOpen(true)
    captureEvent("newShortformClicked", {tagId: tag._id, tagName: tag.name, pageSectionContext: "tagHeader"})
  }, [captureEvent, setNewShortformOpen, tag._id, tag.name])

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
  const sortBy = (sortByOptions.includes(query.sortedBy) && query.sortedBy) || (sortByOptions.includes(tag.postsDefaultSortOrder) && tag.postsDefaultSortOrder) || defaultSubforumSorting;
  
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

  const shortformButton = (
    <LWTooltip
      title={"You must be logged in to create a shortform"}
      disabled={!!currentUser}
      className={classNames(classes.newPostLink, classes.newPostLinkHover)}
    >
      <SectionButton onClick={currentUser ? clickNewShortform : () => {}}>
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
  
  const cardLayoutComponent = <>
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
      // type is guaranteed to be SubforumSorting by the `sortByOptions` logic above
      resolverName={`Subforum${subforumSortingToResolverName(sortBy as SubforumSorting)}Feed`}
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
    ...tagPostTerms(tag, query),
    limit: 10
  }
  console.log("terms", terms)
  const listLayoutComponent = (
    <div className={classes.listLayout}>
      <PostsList2 terms={terms} tagId={tag._id} itemsPerPage={50} hideTagRelevance enableTotal/>
      <CommentsListCondensed
        label={"Shortforms"}
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
        {/* <div className={classes.feedHeaderButtons}>
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
            <SortButton label={<span>Sorted by {TAG_POSTS_SORT_ORDER_OPTIONS[sortBy].label}<span className={classes.hideOnMobile}>, {layout === "feed" ? preferredHeadingCase('Posts Expanded') : preferredHeadingCase('Posts Collapsed')}</span></span>} />
          </div>
        </LWTooltip> */}
      </div>
      {/* {showSettings && (
        <div className={classes.listSettingsContainer}>
          <SubforumListSettings currentSorting={sortBy} currentLayout={layout} />
        </div>
      )} */}
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
