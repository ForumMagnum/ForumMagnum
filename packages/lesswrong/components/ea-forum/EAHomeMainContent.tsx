import React, { ComponentType, useEffect, useMemo, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import classNames from 'classnames';
import { tagPostTerms } from '../tagging/TagPage';
import { useMulti } from '../../lib/crud/withMulti';
import debounce from 'lodash/debounce';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import qs from 'qs';


const styles = (theme: ThemeType): JssStyles => ({
  tabsSection: {
    marginTop: 10,
    marginBottom: 26,
    [theme.breakpoints.down('sm')]: {
      marginTop: 20,
    },
  },
  tabsRow: {
    position: 'relative',
  },
  tabsWindowContainer: {
    position: 'relative',
  },
  tabsWindow: {
    position: 'relative',
    overflowX: 'scroll',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      height: 0
    }
  },
  leftFade: {
    '&:before': {
      position: 'absolute',
      top: 0,
      left: -1,
      height: '100%',
      width: 50,
      content: "''",
      background: `linear-gradient(to right, ${theme.palette.background.default}, ${theme.palette.background.transparent})`,
      pointerEvents: 'none',
      zIndex: 1
    }
  },
  rightFade: {
    '&:after': {
      position: 'absolute',
      top: 0,
      right: -1,
      height: '100%',
      width: 50,
      content: "''",
      background: `linear-gradient(to left, ${theme.palette.background.default}, ${theme.palette.background.transparent})`,
      pointerEvents: 'none'
    }
  },
  arrow: {
    position: 'absolute',
    top: 0,
    height: 30,
    width: 28,
    color: theme.palette.grey[500],
    paddingTop: 7,
    paddingLeft: 6,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[700],
    },
    '@media (max-width: 840px)': {
      display: 'none',
    },
  },
  arrowIcon: {
    fontSize: 18
  },
  leftArrow: {
    left: -30,
  },
  rightArrow: {
    right: -30,
  },
  topicsBar: {
    display: 'flex',
    columnGap: 8,
    whiteSpace: 'nowrap',
    transition: 'transform 0.2s ease',
    '@media (max-width: 840px)': {
      columnGap: 6,
    }
  },
  tab: {
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[900],
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '23px',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: 6,
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.grey[300],
    },
    '@media (max-width: 840px)': {
      fontSize: 12,
      lineHeight: '18px',
      padding: '4px 6px',
    }
  },
  activeTab: {
    backgroundColor: theme.palette.grey[1000],
    color: theme.palette.grey[0],
    "&:hover": {
      backgroundColor: theme.palette.grey[1000],
    },
    "&.EAHomeMainContent-givingSeasonTab": {
      backgroundColor: theme.palette.givingPortal.button.alwaysDark,
      color: theme.palette.text.alwaysWhite,
      "&:hover": {
        backgroundColor: theme.palette.givingPortal[900],
      },
    }
  },
  givingSeasonTab: {
    backgroundColor: theme.palette.givingPortal[800],
    color: theme.palette.givingPortal[1000],
    "&:hover": {
      backgroundColor: theme.palette.givingPortal[900],
    },
  },
  spotlightMargin: {
    marginBottom: 24,
  },
  learnMoreLink: {
    fontSize: 14,
    color: theme.palette.grey[600],
    fontWeight: 600
  },
})

type TopicsBarTab = {
  _id: string,
  name: string,
  shortName?: string|null,
  slug?: string
}

const frontpageTab = {_id: '0', name: 'Frontpage'}

// The order in which the topics are displayed is slightly different from their default ordering
const topicTabsOrder = [
  'L6NqHZkLc4xZ7YtDr', // Effective giving is at the front of the list for giving season - TODO: remove after giving season
  'sWcuTyTB5dP3nas2t', // Global health
  'QdH9f8TC6G8oGYdgt', // Animal welfare
  'oNiQsBHA3i837sySD', // AI safety
  'ZCihBFp5P64JCvQY6', // Community
  'H43gvLzBCacxxamPe', // Biosecurity & pandemics
  'ee66CtAMYurQreWBH', // Existential risk
  '4eyeLKC64Yvznzt6Z', // Philosophy
  'EHLmbEmJ2Qd5WfwTb', // Building effective altruism
  'of9xBvR3wpbp6qsZC', // Policy
  'psBzwdY8ipfCeExJ7', // Cause prioritization
  // 'L6NqHZkLc4xZ7YtDr', // Effective giving
  '4CH9vsvzyk4mSKwyZ', // Career choice
  'aJnrnnobcBNWRsfAw', // Forecasting & estimation
]

/**
 * This handles displaying the main content on the EA Forum home page,
 * which includes the topics bar and the topic-specific tabs.
 * The "Frontpage" tab content comes from EAHome.
 */
const EAHomeMainContent = ({FrontpageNode, classes}:{
  FrontpageNode: ComponentType,
  classes: ClassesType
}) => {
  // we use the widths of the tabs window and the underlying topics bar
  // when calculating how far to scroll left and right
  const tabsWindowRef = useRef<HTMLDivElement|null>(null)
  const topicsBarRef = useRef<HTMLDivElement|null>(null)

  // we store the topic bar scrollLeft offsets that correspond to displaying each "set" of topics
  const offsets = useRef<Array<number>>([0])

  useEffect(() => {
    if (!tabsWindowRef.current || !topicsBarRef.current) return
    offsets.current = [0]
    Array.from(topicsBarRef.current.children).forEach((topic: HTMLElement) => {
      if (!tabsWindowRef.current || !topicsBarRef.current) return
      // we are looking for the topic that would get cut off at the end of each "set",
      // by checking if the right edge would be past the window
      // - if so, this will be the first in the next "set"
      if (topic.offsetLeft + topic.offsetWidth - offsets.current[offsets.current.length-1] > tabsWindowRef.current.offsetWidth) {
        // subtract 30px to account for the fade on the left side of the tabs window
        offsets.current.push(topic.offsetLeft - 30)
      }
    })
  }, [tabsWindowRef, topicsBarRef])
  
  const { results: coreTopics } = useMulti({
    terms: {view: "coreTags"},
    collectionName: "Tags",
    fragmentName: 'TagDetailsFragment',
    limit: 40
  })
  let allTabs: TopicsBarTab[] = useMemo(() => {
    let tabs: TopicsBarTab[] = [frontpageTab]
    if (coreTopics) {
      // list the core topics based on topicTabsOrder
      topicTabsOrder.forEach(topicId => {
        const topic = coreTopics.find(t => t._id === topicId)
        if (topic) {
          tabs.push(topic)
        }
      })
    }
    return tabs
  }, [coreTopics])
  
  const [activeTab, setActiveTab] = useState<TopicsBarTab>(frontpageTab)
  const [leftArrowVisible, setLeftArrowVisible] = useState(false)
  const [rightArrowVisible, setRightArrowVisible] = useState(true)
  const { history } = useNavigation()
  const { location, query } = useLocation()
  const { captureEvent } = useTracking()
  const activeCoreTopic = useMemo(
    () => coreTopics?.find(t => t._id === activeTab._id),
    [coreTopics, activeTab]
  );
  
  const { results: spotLightResults } = useMulti({
    collectionName: 'Spotlights',
    fragmentName: 'SpotlightDisplay',
    terms: {
      view: 'spotlightForSequence',
      sequenceId: activeCoreTopic?.sequence?._id,
      limit: 1
    },
    skip: !activeCoreTopic?.sequence?._id,
  });
  const spotlight = spotLightResults?.[0]
  
  useEffect(() => {
    if (coreTopics) {
      // set the initial active tab based on the query,
      // and update the tab if the user clicks on a new one
      const activeTab = coreTopics.find(topic => topic.slug === query.tab)
      if (activeTab) {
        setActiveTab(activeTab)
      } else {
        setActiveTab(frontpageTab)
      }
    }
  }, [coreTopics, query])
  
  /**
   * When the topics bar is scrolled, hide/show the left/right arrows as necessary.
   */
  const updateArrows = debounce(() => {
    if (!tabsWindowRef.current || !topicsBarRef.current) return

    const currentScrollLeft = tabsWindowRef.current.scrollLeft
    // max amount we can scroll to the right, reduced a bit to make sure that
    // we hide the right arrow when scrolled all the way to the right
    const maxScrollLeft = topicsBarRef.current.scrollWidth - tabsWindowRef.current.clientWidth - 10
    
    setLeftArrowVisible(currentScrollLeft > 0)
    setRightArrowVisible(currentScrollLeft < maxScrollLeft)
  }, 80)
  
  /**
   * Clicking the left arrow smooth scrolls us to the previous offset (or defaults to 0).
   */
  const scrollLeft = () => {
    if (!tabsWindowRef.current || !topicsBarRef.current) return
    // look for the offset that is to the left of us
    const nextOffset = Array.from(offsets.current).reverse().find(os => {
      if (!tabsWindowRef.current || !topicsBarRef.current) return false
      return os < (tabsWindowRef.current.scrollLeft - 2)
    }) || 0
    tabsWindowRef.current.scrollTo({
      left: nextOffset,
      behavior: 'smooth'
    })
    setRightArrowVisible(true)
  }
  
  /**
   * Clicking the right arrow smooth scrolls us to the next offset (if one exists).
   */
  const scrollRight = () => {
    if (!tabsWindowRef.current || !topicsBarRef.current) return
    // look for the offset that is to the right of us
    const nextOffset = offsets.current.find(os => {
      if (!tabsWindowRef.current || !topicsBarRef.current) return false
      return os > tabsWindowRef.current.scrollLeft
    })
    if (!nextOffset) return
    tabsWindowRef.current.scrollTo({
      left: nextOffset,
      behavior: 'smooth'
    })
    setLeftArrowVisible(true)
  }
  
  const handleTabClick = (tab: TopicsBarTab) => {
    history.replace({
      ...location,
      search: qs.stringify({...query, tab: tab.slug}),
    })
    captureEvent("topicsBarTabClicked", {topicsBarTabId: tab._id, topicsBarTabName: tab.shortName || tab.name})
  }
  
  const { SingleColumnSection, ForumIcon, SectionTitle, PostsList2, DismissibleSpotlightItem } = Components
  
  const topicPostTerms = {
    ...tagPostTerms(activeTab, {}),
    sortedBy: 'magic',
    limit: 30
  }

  return (
    <>
      <AnalyticsContext pageSectionContext="topicsBar">
        <SingleColumnSection className={classes.tabsSection}>
          <div className={classes.tabsRow}>
            {leftArrowVisible && <div onClick={scrollLeft} className={classNames(classes.arrow, classes.leftArrow)}>
              <ForumIcon icon="ThickChevronLeft" className={classes.arrowIcon} />
            </div>}
            <div className={classNames(classes.tabsWindowContainer, {[classes.leftFade]: leftArrowVisible, [classes.rightFade]: rightArrowVisible})}>
              <div ref={tabsWindowRef} className={classes.tabsWindow} onScroll={() => updateArrows()}>
                <div ref={topicsBarRef} className={classes.topicsBar}>
                  {allTabs.map(tab => {
                    const tabName = tab.shortName || tab.name
                    return <button
                      key={tabName}
                      onClick={() => handleTabClick(tab)}
                      className={classNames(classes.tab, {
                        [classes.activeTab]: tab._id === activeTab._id,
                        [classes.givingSeasonTab]: tab._id === 'L6NqHZkLc4xZ7YtDr' // TODO: remove after giving season
                      })}
                    >
                      {tabName}
                    </button>
                  })}
                </div>
              </div>
            </div>
            {rightArrowVisible && <div onClick={scrollRight} className={classNames(classes.arrow, classes.rightArrow)}>
              <ForumIcon icon="ThickChevronRight" className={classes.arrowIcon} />
            </div>}
          </div>
        </SingleColumnSection>
      </AnalyticsContext>

      {activeTab.name === 'Frontpage' ? <FrontpageNode /> : <AnalyticsContext pageSectionContext="topicSpecificPosts">
        <SingleColumnSection>
          {spotlight && <DismissibleSpotlightItem
            spotlight={spotlight}
            className={classes.spotlightMargin}
          />}
          <SectionTitle title="New & upvoted" noTopMargin>
            <Link to={`/topics/${activeTab.slug}`} className={classes.learnMoreLink}>View more</Link>
          </SectionTitle>
          <PostsList2
            terms={topicPostTerms}
            itemsPerPage={30}
            hideTag
          />
        </SingleColumnSection>
      </AnalyticsContext>}
    </>
  )
}

const EAHomeMainContentComponent = registerComponent('EAHomeMainContent', EAHomeMainContent, {styles});

declare global {
  interface ComponentTypes {
    EAHomeMainContent: typeof EAHomeMainContentComponent
  }
}
