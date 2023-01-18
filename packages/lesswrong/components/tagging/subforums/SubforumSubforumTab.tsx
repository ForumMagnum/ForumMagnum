import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import AddBoxIcon from "@material-ui/icons/AddBox";
import { useLocation } from '../../../lib/routeUtil';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useTracking } from "../../../lib/analyticsEvents";
import { MAX_COLUMN_WIDTH } from '../../posts/PostsPage/PostsPage';
import { useCurrentUser } from '../../common/withUser';
import { useDialog } from '../../common/withDialog';
import startCase from 'lodash/startCase';
import { Link } from '../../../lib/reactRouterWrapper';
import { defaultSubforumSorting, isSubforumSorting, SubforumLayout, SubforumSorting, subforumSortings, subforumSortingToResolverName, subforumSortingTypes } from '../../../lib/collections/tags/subforumHelpers';
import { tagPostTerms } from '../TagPage';
import { useUpdate } from '../../../lib/crud/withUpdate';

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
    marginBottom: -16,
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
  newDiscussionContainer: {
    background: theme.palette.grey[0],
    marginTop: 32,
    padding: "0px 8px 8px 8px",
  },
  feedPostWrapper: {
    marginTop: 32,
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
    paddingTop: 32,
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
    PostsListSortDropdown,
    CommentPermalink,
    LWTooltip,
    SectionButton,
    CommentsNewForm,
    MixedTypeFeed,
    RecentDiscussionThread,
    CommentWithReplies,
    PostsList2,
    AddPostsToTag,
    CommentsListCondensed,
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

  const [newDiscussionOpen, setNewDiscussionOpen] = useState(false)
  const hideIntroPost = currentUser && userTagRel && !!userTagRel?.subforumHideIntroPost
  
  const clickNewDiscussion = useCallback(() => {
    setNewDiscussionOpen(true)
    captureEvent("newDiscussionClicked", {tagId: tag._id, tagName: tag.name, pageSectionContext: "tagHeader"})
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
  const commentsLimit = (currentUser && currentUser.isAdmin) ? 4 : 3;

  const canPostDiscussion = !!(isSubscribed || currentUser?.isAdmin);
  const discussionButton = (
    <LWTooltip
      title={
        canPostDiscussion
          ? "Create a discussion which will only appear in this subforum"
          : "You must be a member of this subforum to create a discussion"
      }
      className={classNames(classes.newPostLink, classes.newPostLinkHover)}
    >
      <SectionButton onClick={canPostDiscussion ? clickNewDiscussion : () => {}}>
        <AddBoxIcon /> <span className={classes.hideOnMobile}>New</span>&nbsp;Discussion
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
            return post._id !== tag.subforumIntroPost?._id && !hideIntroPost && (
              <div className={classes.feedPostWrapper}>
                <RecentDiscussionThread
                  key={post._id}
                  post={{ ...post }}
                  comments={post.recentComments}
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
    limit: 15
  }
  const listLayoutComponent = (
    <div className={classes.listLayout}>
      <PostsList2 terms={terms} enableTotal tagId={tag._id} itemsPerPage={50}>
        <AddPostsToTag tag={tag} />
      </PostsList2>
      <CommentsListCondensed
        label={"Discussions"}
        contentType="subforumDiscussion"
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
          {discussionButton}
          {newPostButton}
        </div>
        <PostsListSortDropdown value={sortBy} options={subforumSortings} />
      </div>
      {newDiscussionOpen && (
        <div className={classes.newDiscussionContainer}>
          {/* FIXME: bug here where the submit and cancel buttons don't do anything the first time you click on them, on desktop only */}
          <CommentsNewForm
            tag={tag}
            tagCommentType={"SUBFORUM"}
            successCallback={refetch}
            type="reply" // required to make the Cancel button appear
            enableGuidelines={true}
            cancelCallback={() => setNewDiscussionOpen(false)}
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
