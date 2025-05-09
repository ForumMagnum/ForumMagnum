import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { tagGetUrl } from '../../../lib/collections/tags/helpers';
import { useMulti } from '../../../lib/crud/withMulti';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useCurrentUser } from '../../common/withUser';
import { MAX_COLUMN_WIDTH } from '@/components/posts/PostsPage/constants';
import { useTagBySlug } from '../useTag';
import Tabs from "@/lib/vendor/@material-ui/core/src/Tabs";
import Tab from "@/lib/vendor/@material-ui/core/src/Tab";
import qs from "qs";
import { subscriptionTypes } from '../../../lib/collections/subscriptions/helpers';
import { useSubscribeUserToTag } from '../../../lib/filterSettings';
import { defaultPostsLayout, isPostsLayout } from '../../../lib/collections/posts/dropdownOptions';
import { getTagStructuredData } from '../TagPageRouter';
import { taggingNamePluralSetting } from '@/lib/instanceSettings';
import { Link } from "../../../lib/reactRouterWrapper";
import { useLocation, useNavigate } from "../../../lib/routeUtil";
import { useCreate } from '@/lib/crud/withCreate';
import { Loading } from "../../vulcan-core/Loading";
import { Error404 } from "../../common/Error404";
import { PermanentRedirect } from "../../common/PermanentRedirect";
import { HeadTags } from "../../common/HeadTags";
import { TagFlagItem } from "../TagFlagItem";
import { SubforumLayout } from "./SubforumLayout";
import { WriteNewButton } from "../WriteNewButton";
import { SubscribeButton } from "../SubscribeButton";
import { TagTableOfContents } from "../TagTableOfContents";
import { SidebarSubtagsBox } from "./SidebarSubtagsBox";
import { SubforumWikiTab } from "./SubforumWikiTab";
import { SubforumSubforumTab } from "./SubforumSubforumTab";

export const styles = (theme: ThemeType) => ({
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
      padding: '28px 12px'
    }
  },
  centralColumn: {
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: MAX_COLUMN_WIDTH,
  },
  header: {
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    width: "100%",
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 32,
      paddingRight: 32,
    }
  },
  titleComponent: {
    paddingTop: 150,
    paddingBottom: 24,
    [theme.breakpoints.down('sm')]: {
      paddingTop: 100,
      paddingLeft: 24,
      paddingRight: 24,
    }
  },
  title: {
    ...theme.typography.headline,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.alwaysWhite,
    marginTop: 0,
    fontSize: 40,
    fontWeight: 600,
    [theme.breakpoints.down('sm')]: {
      fontSize: "2.4rem",
    }
  },
  titleDesktop: {
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  titleMobile: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'block'
    }
  },
  subtitle: {
    ...theme.typography.commentStyle,
    color: theme.palette.text.alwaysWhite,
    fontSize: 14,
  },
  writeNewButton: {
    marginRight: 8,
    [theme.breakpoints.down('xs')]: {
      display: 'none !important'
    },
  },
  nextLink: {
    ...theme.typography.commentStyle
  },
  sidebarBoxWrapper: {
    backgroundColor: theme.palette.panelBackground.default,
    border: theme.palette.border.commentBorder,
    marginBottom: 24,
    marginTop: 24,
  },
  tableOfContentsWrapper: {
    padding: 24,
  },
});

const subforumTabs = ["posts", "wiki"] as const
type SubforumTab = typeof subforumTabs[number]
const defaultTab: SubforumTab = "posts"

const TagSubforumPage2Inner = ({classes}: {
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser();
  const { query, params: { slug } } = useLocation();
  const navigate = useNavigate();

  const isTab = (tab: string): tab is SubforumTab => (subforumTabs as readonly string[]).includes(tab)
  const tab = isTab(query.tab) ? query.tab : defaultTab
  
  const handleChangeTab = useCallback((_: AnyBecauseTodo, value: SubforumTab) => {
    const newQuery = {...query, tab: value}
    navigate({...location, search: `?${qs.stringify(newQuery)}`})
  }, [navigate, query])

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
  const [newShortformOpen, setNewShortformOpen] = useState(false)

  const multiTerms: AnyBecauseTodo = {
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

  const skipUserTagRel = !tag || !currentUser

  const { results: userTagRelResults, loading: userTagRelLoading } = useMulti({
    terms: { view: "single", tagId: tag?._id, userId: currentUser?._id },
    collectionName: "UserTagRels",
    fragmentName: "UserTagRelDetails",
    skip: skipUserTagRel
  });

  const { create: createUserTagRel, data: createdUserTagRelData, called: createUserTagRelCalled } = useCreate({
    collectionName: "UserTagRels",
    fragmentName: "UserTagRelDetails",
  })

  useEffect(() => {
    // Create a new UserTagRel if none exists.  This is replacing the previous behavior of
    // the legacy (since removed) `createIfMissing` in the `useMulti` call above.
    // It's a bit slower than implementing a custom resolver that does both but
    // I don't think subforums are even a thing right now; if the EA forum wants me to do that I can.
    if (userTagRelResults?.length === 0 && !userTagRelLoading && !skipUserTagRel && !createUserTagRelCalled) {
      void createUserTagRel({
        data: { tagId: tag._id, userId: currentUser._id },
      });
    }
  }, [userTagRelResults, userTagRelLoading, createUserTagRel, createUserTagRelCalled, tag, currentUser, skipUserTagRel]);

  const userTagRel = createdUserTagRelData ?? userTagRelResults?.[0];

  // "feed" -> "card" for backwards compatibility, TODO remove after a month or so
  if (query.layout === "feed") {
    query.layout = "card"
  }
  const layout = isPostsLayout(query.layout) ? query.layout : currentUser?.subforumPreferredLayout ?? defaultPostsLayout

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
  
  const { isSubscribed, subscribeUserToTag } = useSubscribeUserToTag(tag ?? undefined)
  
  if (loadingTag)
    return <Loading/>
  if (!tag)
    return <Error404/>
  // If the slug in our URL is not the same as the slug on the tag, redirect to the canonical slug page
  if (tag.oldSlugs?.filter(slug => slug !== tag.slug)?.includes(slug)) {
    return <PermanentRedirect url={tagGetUrl(tag)} />
  }

  const headTagDescription = tag.description?.plaintextDescription || `All posts related to ${tag.name}, sorted by relevance`
  
  const tagFlagItemType: AnyBecauseTodo = {
    allPages: "allPages",
    myPages: "userPages"
  }
  
  const headerComponent = (
    <div className={classNames(classes.header, classes.centralColumn)}>
      {query.flagId && (
        <span>
          <Link to={`/${taggingNamePluralSetting.get()}/dashboard?focus=${query.flagId}`}>
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
        <WriteNewButton
          tag={tag}
          isSubscribed={isSubscribed}
          setNewShortformOpen={setNewShortformOpen}
          className={classes.writeNewButton}
        />
        <SubscribeButton
          tag={tag}
          subscribeMessage="Subscribe"
          unsubscribeMessage="Subscribed"
          subscriptionType={subscriptionTypes.newTagPosts}
          isSubscribedOverride={isSubscribed}
          subscribeUserToTagOverride={subscribeUserToTag}
        />
      </div>
    </div>
  );

  const titleComponent = <div className={classNames(classes.titleComponent, classes.centralColumn)}>
    <div className={classNames(classes.title, classes.titleDesktop)}>{tag.name}</div>
    <div className={classNames(classes.title, classes.titleMobile)}>{tag.shortName || tag.name}</div>
    <div className={classes.subtitle}>{tag.subtitle}</div>
  </div>

  const rightSidebarComponents: Record<SubforumTab, React.JSX.Element[]> = {
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
  
  const tabComponents: Record<SubforumTab, React.JSX.Element> = {
    posts: (
      <SubforumSubforumTab
        tag={tag}
        userTagRel={userTagRel}
        layout={layout}
        newShortformOpen={newShortformOpen}
        setNewShortformOpen={setNewShortformOpen}
      />
    ),
    wiki: <SubforumWikiTab tag={tag} revision={revision} truncated={truncated} setTruncated={setTruncated} />,
  };

  return (
    <AnalyticsContext
      pageContext="tagSubforumPage2"
      tagName={tag.name}
      tagId={tag._id}
      sortedBy={query.sortedBy || "relevance"}
    >
      <HeadTags description={headTagDescription} structuredData={getTagStructuredData(tag)} noIndex={tag.noindex} />
      {hoveredContributorId && <style>{`.by_${hoveredContributorId} {background: rgba(95, 155, 101, 0.35);}`}</style>}
      <SubforumLayout
        titleComponent={titleComponent}
        bannerImageId={tag.bannerImageId!}
        headerComponent={headerComponent}
        sidebarComponents={rightSidebarComponents[tab]}
      >
        {tabComponents[tab]}
      </SubforumLayout>
    </AnalyticsContext>
  );
}

export const TagSubforumPage2 = registerComponent("TagSubforumPage2", TagSubforumPage2Inner, {styles});


