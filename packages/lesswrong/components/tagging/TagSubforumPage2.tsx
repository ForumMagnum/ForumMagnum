import { useApolloClient } from "@apollo/client";
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { userHasNewTagSubscriptions } from "../../lib/betas";
import { subscriptionTypes } from '../../lib/collections/subscriptions/schema';
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
import { forumTypeSetting, taggingNameCapitalSetting, taggingNamePluralCapitalSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import truncateTagDescription from "../../lib/utils/truncateTagDescription";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import qs from "qs";

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
    [theme.breakpoints.down('sm')]: {
      marginTop: 130,
    },
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
  },
  titleRow: {
    [theme.breakpoints.up('sm')]: {
      display: 'flex',
      justifyContent: 'space-between',
    }
  },
  title: {
    ...theme.typography.display3,
    ...theme.typography.commentStyle,
    marginTop: 0,
    fontWeight: 600,
    fontVariant: "small-caps"
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
  sidebarBoxWrapper: {
    backgroundColor: theme.palette.panelBackground.default,
    border: theme.palette.border.commentBorder,
    paddingLeft: "1.5em",
    paddingRight: "1.5em",
    paddingBottom: "1em",
    marginBottom: 24,
  },
  tableOfContentsWrapper: {
    padding: 24,
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

// TODO rename
const subforumTabs = ["posts", "wiki"] as const
type SubforumTab = typeof subforumTabs[number]
const defaultTab: SubforumTab = "posts"

const TagSubforumPage2 = ({classes}: {
  classes: ClassesType
}) => {
  const {
    PostsListSortDropdown, PostsList2, ContentItemBody, Loading, AddPostsToTag, Error404,
    PermanentRedirect, HeadTags, UsersNameDisplay, TagFlagItem, TagDiscussionSection, Typography,
    TagPageButtonRow, RightSidebarColumn, SubscribeButton, CloudinaryImage2, TagIntroSequence,
    SectionTitle, TagTableOfContents, ContentStyles, SidebarSubtagsBox
  } = Components;
  const currentUser = useCurrentUser();
  const { history } = useNavigation();
  const { query, params: { slug } } = useLocation();
  
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
  const [editing, setEditing] = useState(!!query.edit)
  const [hoveredContributorId, setHoveredContributorId] = useState<string|null>(null);
  const { captureEvent } =  useTracking()
  const client = useApolloClient()

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

  // if no sort order was selected, try to use the tag page's default sort order for posts
  if (query.sortedBy || tag.postsDefaultSortOrder) {
    query.sortedBy = query.sortedBy || tag.postsDefaultSortOrder
  }

  const terms = {
    ...tagPostTerms(tag, query),
    limit: 15
  }

  const clickReadMore = () => {
    setTruncated(false)
    captureEvent("readMoreClicked", {tagId: tag._id, tagName: tag.name, pageSectionContext: "wikiSection"})
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
        {!tag.wikiOnly && !editing && userHasNewTagSubscriptions(currentUser) && (
          <SubscribeButton
            tag={tag}
            className={classes.notifyMeButton}
            subscribeMessage="Subscribe"
            unsubscribeMessage="Unsubscribe"
            subscriptionType={subscriptionTypes.newTagPosts}
          />
        )}
      </div>
      <Tabs
        value={tab}
        onChange={handleChangeTab}
        className={classes.tabs}
        textColor="primary"
        aria-label="select tab"
        scrollable
        scrollButtons="off"
      >
        <Tab label="Posts" value="posts" />
        <Tab label="Wiki" value="wiki" />
      </Tabs>
    </div>
  );

  const welcomeBoxComponent = tag.subforumWelcomeText?.html  ? (
    <ContentStyles contentType="tag" key={`welcome_box`}>
      <div className={classes.sidebarBoxWrapper} dangerouslySetInnerHTML={{ __html: truncateTagDescription(tag.subforumWelcomeText.html, false)}} />
    </ContentStyles>
  ) : <></>;
  const rightSidebarComponents = [welcomeBoxComponent, <SidebarSubtagsBox tagId={tag._id} className={classes.sidebarBoxWrapper} key={`subtags_box`}/>];

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
                    />
                  </div>,
                ]
              : rightSidebarComponents
          }
          header={headerComponent}
        >
          {tab === "wiki" ? wikiComponent : <p className={classes.centralColumn}>PLACEHOLDER FOR POSTS COMPONENT</p>}
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
