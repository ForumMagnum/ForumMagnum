import { useApolloClient } from "@apollo/client";
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { tagGetUrl, tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { useMulti } from '../../lib/crud/withMulti';
import { truncate } from '../../lib/editor/ellipsize';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { useOnSearchHotkey } from '../common/withGlobalKeydown';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { MAX_COLUMN_WIDTH } from '../posts/PostsPage/PostsPage';
import { EditTagForm } from './EditTagPage';
import { useTagBySlug } from './useTag';
import { forumTypeSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import truncateTagDescription from "../../lib/utils/truncateTagDescription";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import AddBoxIcon from "@material-ui/icons/AddBox";
import qs from "qs";
import { useDialog } from "../common/withDialog";
import {
  defaultSubforumSorting,
  isSubforumSorting,
  SubforumSorting,
  subforumSortings,
  subforumSortingToResolverName,
  subforumSortingTypes,
} from "../../lib/subforumSortings";

const isEAForum = forumTypeSetting.get() === 'EAForum'

export const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: "100%"
  },
  tabs: {
    margin: '0 auto 0px',
    '& .MuiTab-root': {
      minWidth: 80,
      [theme.breakpoints.down('xs')]: {
        minWidth: 50
      }
    },
    '& .MuiTab-labelContainer': {
      fontSize: '1rem'
    }
  },
  contentGivenImage: {
    marginTop: 185,
  },
  imageContainer: {
    position: 'absolute',
    width: "100%",
    '& > img': {
      objectFit: 'cover',
      width: '100%',
    },
    [theme.breakpoints.down('sm')]: {
      '& > img': {
        height: 270,
      },
      top: 77,
      left: -4,
    },
    [theme.breakpoints.up('sm')]: {
      top: 90,
      '& > img': {
        height: 300,
      },
    }
  },
  centralColumn: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: MAX_COLUMN_WIDTH,
  },
  header: {
    paddingTop: 19,
    paddingBottom: 0,
    paddingLeft: 42,
    paddingRight: 42,
    background: theme.palette.panelBackground.default,
    width: "100%",
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 32,
      paddingRight: 32,
    }
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  title: {
    ...theme.typography.display3,
    ...theme.typography.commentStyle,
    marginTop: 0,
    fontWeight: 600,
    fontVariant: "small-caps",
    [theme.breakpoints.down('sm')]: {
      fontSize: "2.4rem",
    }
  },
  notifyMeButton: {
    [theme.breakpoints.down('xs')]: {
      marginTop: 6,
    },
  },
  editMenu: {
    [theme.breakpoints.down('xs')]: {
      marginTop: 16,
      marginBottom: 8,
    },
  },
  wikiSection: {
    paddingTop: 12,
    paddingLeft: 42,
    paddingRight: 42,
    paddingBottom: 12,
    marginBottom: 24,
    background: theme.palette.panelBackground.default,
  },
  subHeading: {
    paddingLeft: 42,
    paddingRight: 42,
    marginTop: -2,
    background: theme.palette.panelBackground.default,
    ...theme.typography.body2,
    ...theme.typography.postStyle,
  },
  subHeadingInner: {
    paddingTop: 2,
    paddingBottom: 2,
    borderTop: theme.palette.border.extraFaint,
    borderBottom: theme.palette.border.extraFaint,
  },
  relatedTagLink : {
    color: theme.palette.lwTertiary.dark
  },
  tagHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  postsTaggedTitle: {
    color: theme.palette.grey[600]
  },
  pastRevisionNotice: {
    ...theme.typography.commentStyle,
    fontStyle: 'italic'
  },
  nextLink: {
    ...theme.typography.commentStyle
  },
  newPostLink: {
    display: "flex",
    alignItems: "center",
  },
  sidebarBoxWrapper: {
    backgroundColor: theme.palette.panelBackground.default,
    border: theme.palette.border.commentBorder,
    marginBottom: 24,
  },
  sidebarBoxWrapperDefaultPadding: {
    padding: "1em 1.5em",
  },
  tableOfContentsWrapper: {
    padding: 24,
  },
  membersListLink: {
    background: 'none',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.primary.main,
    padding: 0,
    '&:hover': {
      opacity: 0.5
    },
    [theme.breakpoints.up('lg')]: {
      display: 'none' // only show on mobile (when the sidebar is not showing)
    }
  },
  joinBtn: {
    // FIXME: refactor to remove these !importants once the old subforum page is deprecated (this is the only other place SubforumSubscribeSection is used)
    alignItems: 'center !important',
    padding: '4px 0 0 0 !important',
    '& button': {
      minHeight: 0,
      fontSize: 14,
      padding: 8
    },
    [theme.breakpoints.down('sm')]: {
      padding: '2px 0 0 0 !important',
      '& button': {
        minHeight: 0,
        fontSize: 12,
        padding: 6
      },
    }
  },
  notificationSettings: {
    marginTop: 6,
    [theme.breakpoints.down('sm')]: {
      marginTop: 4,
    }
  },
  feedWrapper: {
    padding: "0 10px",
  },
  feedHeader: {
    display: "flex",
    marginBottom: -16,
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
  }
});

export const tagPostTerms = (tag: TagBasicInfo | null, query: any) => {
  if (!tag) return
  return ({
    ...query,
    filterSettings: {tags:[{tagId: tag._id, tagName: tag.name, filterMode: "Required"}]},
    view: "tagRelevance",
    tagId: tag._id,
  })
}

const subforumTabs = ["subforum", "wiki"] as const
type SubforumTab = typeof subforumTabs[number]
const defaultTab: SubforumTab = "subforum"

const TagSubforumPage2 = ({classes}: {
  classes: ClassesType
}) => {
  const {
    PostsListSortDropdown, PostsList2, ContentItemBody, Loading, AddPostsToTag, Error404, LWTooltip,
    PermanentRedirect, HeadTags, UsersNameDisplay, TagFlagItem, TagDiscussionSection, Typography,
    TagPageButtonRow, RightSidebarColumn, CloudinaryImage2, TagIntroSequence, SidebarMembersBox, CommentPermalink,
    SubforumNotificationSettings, SubforumSubscribeSection, SectionTitle, TagTableOfContents, ContentStyles,
    SidebarSubtagsBox, MixedTypeFeed, SectionButton, CommentWithReplies, RecentDiscussionThread, CommentsNewForm
  } = Components;
  const currentUser = useCurrentUser();
  const { query, params: { slug } } = useLocation();
  const { history } = useNavigation();
  
  const isTab = (tab: string): tab is SubforumTab => (subforumTabs as readonly string[]).includes(tab)
  const tab = isTab(query.tab) ? query.tab : defaultTab
  
  const handleChangeTab = (_, value: SubforumTab) => {
    const newQuery = {...query, tab: value}
    history.push({...location, search: `?${qs.stringify(newQuery)}`})
  }
  
  // Support URLs with ?version=1.2.3 or with ?revision=1.2.3 (we were previously inconsistent, ?version is now preferred)
  const { version: queryVersion, revision: queryRevision } = query;
  const revision = queryVersion ?? queryRevision ?? null;
  
  const contributorsLimit = 7;
  const { tag, loading: loadingTag } = useTagBySlug(slug, revision ? "TagPageWithRevisionFragment" : "TagPageFragment", {
    extraVariables: revision ? {
      version: 'String',
      contributorsLimit: 'Int',
    } : {
      contributorsLimit: 'Int',
    },
    extraVariablesValues: revision ? {
      version: revision,
      contributorsLimit,
    } : {
      contributorsLimit,
    },
  });
  
  const [truncated, setTruncated] = useState(true)
  const [newDiscussionOpen, setNewDiscussionOpen] = useState(false)
  const [editing, setEditing] = useState(!!query.edit)
  const [hoveredContributorId, setHoveredContributorId] = useState<string|null>(null);
  const { captureEvent } =  useTracking()
  const client = useApolloClient()

  const refetchRef = useRef<null|(()=>void)>(null);
  const refetch = useCallback(() => {
    if (refetchRef.current)
      refetchRef.current();
  }, [refetchRef]);

  const multiTerms = {
    allPages: {view: "allPagesByNewest"},
    myPages: {view: "userTags", userId: currentUser?._id},
    //tagFlagId handled as default case below
  }

  const { results: otherTagsWithNavigation } = useMulti({
    terms: ["allPages", "myPages"].includes(query.focus) ? multiTerms[query.focus] : {view: "tagsByTagFlag", tagFlagId: query.focus},
    collectionName: "Tags",
    fragmentName: 'TagWithFlagsFragment',
    limit: 1500,
    skip: !query.flagId
  })

  const { openDialog } = useDialog();
  const { totalCount: membersCount, loading: membersCountLoading } = useMulti({
    terms: {view: 'tagCommunityMembers', profileTagId: tag?._id, limit: 0},
    collectionName: 'Users',
    fragmentName: 'UsersProfile',
    enableTotal: true,
    skip: !tag
  })

  const onClickMembersList = () => {
    if (!tag) return;

    openDialog({
      componentName: 'SubforumMembersDialog',
      componentProps: {tag},
      closeOnNavigate: true
    })
  }
  
  useOnSearchHotkey(() => setTruncated(false));

  const tagPositionInList = otherTagsWithNavigation?.findIndex(tagInList => tag?._id === tagInList._id);
  // We have to handle updates to the listPosition explicitly, since we have to deal with three cases
  // 1. Initially the listPosition is -1 because we don't have a list at all yet
  // 2. Then we have the real position
  // 3. Then we remove the tagFlag, we still want it to have the right next button
  const [nextTagPosition, setNextTagPosition] = useState<number | null>(null);
  useEffect(() => {
    // Initial list position setting
    if (tagPositionInList && tagPositionInList >= 0) {
      setNextTagPosition(tagPositionInList + 1)
    }
    if (nextTagPosition !== null && tagPositionInList && tagPositionInList < 0) {
      // Here we want to decrement the list positions by one, because we removed the original tag and so
      // all the indices are moved to the next
      setNextTagPosition(nextTagPosition => (nextTagPosition || 1) - 1)
    }
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagPositionInList])
  const nextTag = otherTagsWithNavigation && (nextTagPosition !== null && nextTagPosition >= 0) && otherTagsWithNavigation[nextTagPosition]
  
  const expandAll = useCallback(() => {
    setTruncated(false)
  }, []);

  const onHoverContributor = useCallback((userId: string) => {
    setHoveredContributorId(userId);
  }, []);
  
  if (loadingTag)
    return <Loading/>
  if (!tag)
    return <Error404/>
  // If the slug in our URL is not the same as the slug on the tag, redirect to the canonical slug page
  if (tag.oldSlugs?.filter(slug => slug !== tag.slug)?.includes(slug)) {
    return <PermanentRedirect url={tagGetUrl(tag)} />
  }
  if (editing && !tagUserHasSufficientKarma(currentUser, "edit")) {
    throw new Error(`Sorry, you cannot edit ${taggingNamePluralSetting.get()} without ${tagMinimumKarmaPermissions.edit} or more karma.`)
  }

  const isSubscribed = !!currentUser?.profileTagIds?.includes(tag._id)

  // if no sort order was selected, try to use the tag page's default sort order for posts
  const sortBy: SubforumSorting = (isSubforumSorting(query.sortedBy) && query.sortedBy) || (isSubforumSorting(tag.postsDefaultSortOrder) && tag.postsDefaultSortOrder) || defaultSubforumSorting;

  const terms = {
    ...tagPostTerms(tag, query),
    limit: 15
  }

  const clickReadMore = () => {
    setTruncated(false)
    captureEvent("readMoreClicked", {tagId: tag._id, tagName: tag.name, pageSectionContext: "wikiSection"})
  }

  const clickNewDiscussion = () => {
    setNewDiscussionOpen(true)
    captureEvent("newDiscussionClicked", {tagId: tag._id, tagName: tag.name, pageSectionContext: "tagHeader"})
  }

  const htmlWithAnchors = tag.tableOfContents?.html ?? tag.description?.html ?? ""
  let description = htmlWithAnchors;
  // EA Forum wants to truncate much less than LW
  if(isEAForum) {
    description = truncated ? truncateTagDescription(htmlWithAnchors) : htmlWithAnchors;
  } else {
    description = (truncated && !tag.wikiOnly)
    ? truncate(htmlWithAnchors, tag.descriptionTruncationCount || 4, "paragraphs", "<span>...<p><a>(Read More)</a></p></span>")
    : htmlWithAnchors
  }

  const headTagDescription = tag.description?.plaintextDescription || `All posts related to ${tag.name}, sorted by relevance`
  
  const tagFlagItemType = {
    allPages: "allPages",
    myPages: "userPages"
  }
  
  // TODO: put this in a separate file
  const wikiComponent = (
    <>
      <div className={classNames(classes.wikiSection, classes.centralColumn)}>
        <TagPageButtonRow tag={tag} editing={editing} setEditing={setEditing} />
        <AnalyticsContext pageSectionContext="wikiSection">
          {revision && tag.description && (tag.description as TagRevisionFragment_description).user && (
            <div className={classes.pastRevisionNotice}>
              You are viewing revision {tag.description.version}, last edited by{" "}
              <UsersNameDisplay user={(tag.description as TagRevisionFragment_description).user} />
            </div>
          )}
          {editing ? (
            <EditTagForm
              tag={tag}
              successCallback={async () => {
                setEditing(false);
                await client.resetStore();
              }}
              cancelCallback={() => setEditing(false)}
            />
          ) : (
            <div onClick={clickReadMore}>
              <ContentStyles contentType="tag">
                <ContentItemBody
                  dangerouslySetInnerHTML={{ __html: description || "" }}
                  description={`tag ${tag.name}`}
                  className={classes.description}
                />
              </ContentStyles>
            </div>
          )}
        </AnalyticsContext>
      </div>
      <div className={classes.centralColumn}>
        {editing && <TagDiscussionSection key={tag._id} tag={tag} />}
        {tag.sequence && <TagIntroSequence tag={tag} />}
        {!tag.wikiOnly && (
          <AnalyticsContext pageSectionContext="tagsSection">
            {tag.sequence ? (
              <SectionTitle title={`Posts tagged ${tag.name}`}>
                <PostsListSortDropdown value={query.sortedBy || "relevance"} />
              </SectionTitle>
            ) : (
              <div className={classes.tagHeader}>
                <div className={classes.postsTaggedTitle}>
                  Posts tagged <em>{tag.name}</em>
                </div>
                <PostsListSortDropdown value={query.sortedBy || "relevance"} />
              </div>
            )}
            <PostsList2 terms={terms} enableTotal tagId={tag._id} itemsPerPage={200}>
              <AddPostsToTag tag={tag} />
            </PostsList2>
          </AnalyticsContext>
        )}
      </div>
    </>
  );
  
  const headerComponent = (
    <div className={classNames(classes.header, classes.centralColumn)}>
      {query.flagId && (
        <span>
          <Link to={`/tags/dashboard?focus=${query.flagId}`}>
            <TagFlagItem
              itemType={["allPages", "myPages"].includes(query.flagId) ? tagFlagItemType[query.flagId] : "tagFlagId"}
              documentId={query.flagId}
            />
          </Link>
          {nextTag && (
            <span onClick={() => setEditing(true)}>
              <Link className={classes.nextLink} to={tagGetUrl(nextTag, { flagId: query.flagId, edit: true })}>
                Next Tag ({nextTag.name})
              </Link>
            </span>
          )}
        </span>
      )}
      <div className={classes.titleRow}>
        <Typography variant="display3" className={classes.title}>
          {tag.name}
        </Typography>
        {/* TODO change what appears in SubforumNotificationSettings list */}
        {/* Join/Leave button always appears in members list, so only show join button here as an extra nudge if they are not a member */}
        {!!currentUser && !editing && (isSubscribed ? <SubforumNotificationSettings tag={tag} currentUser={currentUser} className={classes.notificationSettings} /> : <SubforumSubscribeSection tag={tag} className={classes.joinBtn} />)}
      </div>
      <div className={classes.membersListLink}>
        {!membersCountLoading && <button className={classes.membersListLink} onClick={onClickMembersList}>{membersCount} members</button>}
      </div>
      <Tabs
        value={tab}
        onChange={handleChangeTab}
        className={classes.tabs}
        textColor="primary"
        aria-label="select tab"
        scrollButtons="off"
      >
        <Tab label="Subforum" value="subforum" />
        <Tab label="Wiki" value="wiki" />
      </Tabs>
    </div>
  );

  const welcomeBoxComponent = tag.subforumWelcomeText?.html  ? (
    <ContentStyles contentType="tag" key={`welcome_box`}>
      <div className={classNames(classes.sidebarBoxWrapper, classes.sidebarBoxWrapperDefaultPadding)} dangerouslySetInnerHTML={{ __html: truncateTagDescription(tag.subforumWelcomeText.html, false)}} />
    </ContentStyles>
  ) : <></>;
  const rightSidebarComponents = [
    welcomeBoxComponent,
    <SidebarMembersBox tag={tag} className={classes.sidebarBoxWrapper} key={`members_box`} />,
    <SidebarSubtagsBox tag={tag} className={classNames(classes.sidebarBoxWrapper, classes.sidebarBoxWrapperDefaultPadding)} key={`subtags_box`} />,
  ];

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
  const commentsLimit = (currentUser && currentUser.isAdmin) ? 4 : 3;

  const discussionButton = isSubscribed || currentUser?.isAdmin ? (
    <SectionButton onClick={clickNewDiscussion}>
      <AddBoxIcon /> <span className={classes.hideOnMobile}>New</span>&nbsp;Comment
    </SectionButton>
  ) : (
    <LWTooltip title="You must be a member of this subforum to start a discussion" className={classes.newPostLink}>
      <SectionButton>
        <AddBoxIcon /> <span className={classes.hideOnMobile}>New</span>&nbsp;Thread
      </SectionButton>
    </LWTooltip>
  );

  const subforumFeedComponent = (
    <div className={classNames(classes.centralColumn, classes.feedWrapper)}>
      {query.commentId && (
        <div className={classes.commentPermalink}>
          <CommentPermalink documentId={query.commentId} />
        </div>
      )}
      <div className={classes.feedHeader}>
        <div className={classes.feedHeaderButtons}>
          {discussionButton}
          <Link to={`/newPost?subforumTagId=${tag._id}`} className={classes.newPostLink}>
            <SectionButton>
              <AddBoxIcon /> <span className={classes.hideOnMobile}>New</span>&nbsp;Post
            </SectionButton>
          </Link>
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
            render: (post: PostsRecentDiscussion) => (
              <div className={classes.feedPostWrapper}>
                <RecentDiscussionThread
                  key={post._id}
                  post={{ ...post }}
                  comments={post.recentComments}
                  maxLengthWords={50}
                  refetch={refetch}
                />
              </div>
            ),
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
    </div>
  );

  return (
    <AnalyticsContext
      pageContext="tagPage"
      tagName={tag.name}
      tagId={tag._id}
      sortedBy={query.sortedBy || "relevance"}
      limit={terms.limit}
    >
      <HeadTags description={headTagDescription} />
      {hoveredContributorId && <style>{`.by_${hoveredContributorId} {background: rgba(95, 155, 101, 0.35);}`}</style>}
      {tag.bannerImageId && (
        <div className={classes.imageContainer}>
          <CloudinaryImage2 publicId={tag.bannerImageId} fullWidthHeader />
        </div>
      )}
      <div className={tag.bannerImageId ? classes.contentGivenImage : ""}>
        <RightSidebarColumn
          sidebarComponents={
            tab === "wiki"
              ? [
                  <div key={`toc_${tag._id}`} className={classes.tableOfContentsWrapper}>
                    <TagTableOfContents
                      tag={tag}
                      expandAll={expandAll}
                      showContributors={true}
                      onHoverContributor={onHoverContributor}
                      allowSubforumLink={false}
                    />
                  </div>,
                ]
              : rightSidebarComponents
          }
          header={headerComponent}
        >
          {tab === "wiki" ? wikiComponent : subforumFeedComponent}
        </RightSidebarColumn>
      </div>
    </AnalyticsContext>
  );
}

const TagSubforumPage2Component = registerComponent("TagSubforumPage2", TagSubforumPage2, {styles});

declare global {
  interface ComponentTypes {
    TagSubforumPage2: typeof TagSubforumPage2Component
  }
}
