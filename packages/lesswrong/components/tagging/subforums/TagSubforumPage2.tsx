import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { tagGetUrl } from '../../../lib/collections/tags/helpers';
import { useMulti } from '../../../lib/crud/withMulti';
import { Link } from '../../../lib/reactRouterWrapper';
import { useLocation, useNavigation } from '../../../lib/routeUtil';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useCurrentUser } from '../../common/withUser';
import { MAX_COLUMN_WIDTH } from '../../posts/PostsPage/PostsPage';
import { useTagBySlug } from '../useTag';
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import qs from "qs";
import { defaultSubforumLayout, isSubforumLayout } from '../../../lib/collections/tags/subforumHelpers';
import { subscriptionTypes } from '../../../lib/collections/subscriptions/schema';

export const styles = (theme: ThemeType): JssStyles => ({
  tabRow: {
    display: 'flex',
    alignItems: 'center',
  },
  tabs: {
    marginRight: 'auto',
    '& .MuiTab-root': {
      minWidth: 80,
      [theme.breakpoints.down('xs')]: {
        minWidth: 50
      }
    },
    '& .MuiTab-labelContainer': {
      fontSize: '1rem',
      padding: '24px 12px'
    }
  },
  imageContainer: {
    position: 'absolute',
    width: "100%",
    '& > picture > img': {
      objectFit: 'cover',
      width: '100%',
    },
    [theme.breakpoints.down('sm')]: {
      '& > picture > img': {
        height: 200,
      },
      top: 77,
      left: -4,
    },
    [theme.breakpoints.up('sm')]: {
      top: 90,
      '& > picture > img': {
        height: 250,
      },
    }
  },
  centralColumn: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: MAX_COLUMN_WIDTH,
  },
  header: {
    height: 64,
    background: theme.palette.panelBackground.default,
    width: "100%",
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 32,
      paddingRight: 32,
    }
  },
  titleComponent: {
    paddingTop: 150,
    paddingBottom: 24,
  },
  title: {
    ...theme.typography.headline,
    color: theme.palette.text.alwaysWhite,
    // TODO come back to text outline
    // 3px blur radius, TODO shorten this
    // textShadow: "0 0 3px rgba(0,0,0,0.5), 0 0 3px rgba(0,0,0,0.5), 0 0 3px rgba(0,0,0,0.5), 0 0 3px rgba(0,0,0,0.5), 0 0 3px rgba(0,0,0,0.5), 0 0 3px rgba(0,0,0,0.5), 0 0 3px rgba(0,0,0,0.5), 0 0 3px rgba(0,0,0,0.5), 0 0 3px rgba(0,0,0,0.5), 0 0 3px rgba(0,0,0,0.5)",
    marginTop: 0,
    fontSize: 40,
    fontWeight: 600,
    [theme.breakpoints.down('sm')]: {
      fontSize: "2.4rem",
    }
  },
  subtitle: {
    ...theme.typography.headline,
    // white font with black outline
    color: theme.palette.text.alwaysWhite,
    // 2px blur radius, TODO shorten this
    // textShadow: "0 0 2px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.5), 0 0 2px rgba(0,0,0,0.5)",
    fontSize: 14,
  },
  notifyMeButton: {
    [theme.breakpoints.down('xs')]: {
      marginTop: 6,
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
  nextLink: {
    ...theme.typography.commentStyle
  },
  sidebarBoxWrapper: {
    backgroundColor: theme.palette.panelBackground.default,
    border: theme.palette.border.commentBorder,
    marginBottom: 24,
    marginTop: 24, // FIXME temporary hack to make it not look weird, actually line up with feed/list
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
});

const subforumTabs = ["posts", "wiki"] as const
type SubforumTab = typeof subforumTabs[number]
const defaultTab: SubforumTab = "posts"

const TagSubforumPage2 = ({classes}: {
  classes: ClassesType
}) => {
  const {
    Loading,
    Error404,
    PermanentRedirect,
    HeadTags,
    TagFlagItem,
    Typography,
    RightSidebarColumn,
    CloudinaryImage2,
    SubscribeButton,
    TagTableOfContents,
    SidebarSubtagsBox,
    SubforumWikiTab,
    SubforumSubforumTab,
  } = Components;

  const currentUser = useCurrentUser();
  const { query, params: { slug } } = useLocation();
  const { history } = useNavigation();

  const isTab = (tab: string): tab is SubforumTab => (subforumTabs as readonly string[]).includes(tab)
  const tab = isTab(query.tab) ? query.tab : defaultTab
  
  const handleChangeTab = useCallback((_, value: SubforumTab) => {
    const newQuery = {...query, tab: value}
    history.push({...location, search: `?${qs.stringify(newQuery)}`})
  }, [history, query])

  // "subforum" tab is now called "posts", so redirect to the new tab name
  useEffect(() => {
    if (query.tab === "subforum") {
      handleChangeTab(null, "posts")
    }
  }, [handleChangeTab, query.tab, tab])
  
  // Support URLs with ?version=1.2.3 or with ?revision=1.2.3 (we were previously inconsistent, ?version is now preferred)
  const { version: queryVersion, revision: queryRevision } = query;
  const revision = queryVersion ?? queryRevision ?? undefined;
  
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
  
  const [truncated, setTruncated] = useState(true) // Used in SubforumWikiTab, defined here because it can be controlled from the sidebar
  const [hoveredContributorId, setHoveredContributorId] = useState<string|null>(null);

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

  const { results: userTagRelResults } = useMulti({
    terms: { view: "single", tagId: tag?._id, userId: currentUser?._id },
    collectionName: "UserTagRels",
    fragmentName: "UserTagRelDetails",
    // Create a new UserTagRel if none exists. The check for the existence of tagId and userId is
    // in principle redundant because of `skip`, but it would be bad to create a UserTagRel with
    // a null tagId or userId so be extra careful.
    createIfMissing: tag?._id && currentUser?._id ? { tagId: tag?._id, userId: currentUser?._id } : undefined,
    skip: !tag || !currentUser
  });
  const userTagRel = userTagRelResults?.[0];

  const layout = isSubforumLayout(query.layout) ? query.layout : currentUser?.subforumPreferredLayout ?? defaultSubforumLayout

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

  const isSubscribed = !!currentUser?.profileTagIds?.includes(tag._id)
  const headTagDescription = tag.description?.plaintextDescription || `All posts related to ${tag.name}, sorted by relevance`
  
  const tagFlagItemType = {
    allPages: "allPages",
    myPages: "userPages"
  }
  
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
            <span>
              <Link className={classes.nextLink} to={tagGetUrl(nextTag, { flagId: query.flagId, edit: true })}>
                Next Tag ({nextTag.name})
              </Link>
            </span>
          )}
        </span>
      )}
      {/* TODO Tabs component below causes an SSR mismatch, because its subcomponent TabIndicator has its own styles.
      Importing those into usedMuiStyles.ts didn't fix it; EV of further investigation didn't seem worth it for now. */}
      <div className={classes.tabRow}>
        <Tabs
          value={tab}
          onChange={handleChangeTab}
          className={classes.tabs}
          textColor="primary"
          aria-label="select tab"
          scrollButtons="off"
        >
          <Tab label="Posts" value="posts" />
          <Tab label="Wiki" value="wiki" />
        </Tabs>
        <SubscribeButton
          tag={tag}
          userTagRel={userTagRel}
          subscribeMessage="Subscribe"
          unsubscribeMessage="Unsubscribe"
          subscriptionType={subscriptionTypes.newTagPosts}
          className={classes.notifyMeButton}
        />
      </div>
    </div>
  );

  const titleComponent = <div className={classNames(classes.titleComponent, classes.centralColumn)}>
    <div className={classes.title}>{tag.name}</div>
    {/* TODO add new field for this (don't reuse welcome text) */}
    <div className={classes.subtitle}>Effective giving is the branch of effective altruism focused on charitable donations.</div>
  </div>

  const rightSidebarComponents: Record<SubforumTab, JSX.Element[]> = {
    posts: [
      <SidebarSubtagsBox tag={tag} className={classes.sidebarBoxWrapper} key={`subtags_box`} />,
    ],
    wiki: [
      <div key={`toc_${tag._id}`} className={classes.tableOfContentsWrapper}>
        <TagTableOfContents
          tag={tag}
          expandAll={expandAll}
          showContributors={true}
          onHoverContributor={onHoverContributor}
        />
      </div>,
    ],
  };
  
  const tabComponents: Record<SubforumTab, JSX.Element> = {
    posts: <SubforumSubforumTab tag={tag} isSubscribed={isSubscribed} userTagRel={userTagRel} layout={layout} />,
    wiki: <SubforumWikiTab tag={tag} revision={revision} truncated={truncated} setTruncated={setTruncated} />
  }

  return (
    <AnalyticsContext
      pageContext="tagSubforumPage2"
      tagName={tag.name}
      tagId={tag._id}
      sortedBy={query.sortedBy || "relevance"}
    >
      <HeadTags description={headTagDescription} />
      {hoveredContributorId && <style>{`.by_${hoveredContributorId} {background: rgba(95, 155, 101, 0.35);}`}</style>}
      {/* {tag.bannerImageId && (
        <div className={classes.imageContainer}>
          <CloudinaryImage2 publicId={tag.bannerImageId} fullWidthHeader />
        </div>
      )} */}
      <RightSidebarColumn
        titleComponent={titleComponent}
        headerComponent={headerComponent}
        sidebarComponents={rightSidebarComponents[tab]}
      >
        {tabComponents[tab]}
      </RightSidebarColumn>
    </AnalyticsContext>
  );
}

const TagSubforumPage2Component = registerComponent("TagSubforumPage2", TagSubforumPage2, {styles});

declare global {
  interface ComponentTypes {
    TagSubforumPage2: typeof TagSubforumPage2Component
  }
}
