import React, {CSSProperties, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import { Components, registerComponent } from '../../lib/vulcan-lib/components'
import {AnalyticsContext, useTracking} from '../../lib/analyticsEvents.tsx'
import classNames from 'classnames'
import {useMulti} from '../../lib/crud/withMulti.ts'
import debounce from 'lodash/debounce'
import { useCurrentAndRecentForumEvents } from '../hooks/useCurrentForumEvent.tsx'
import qs from 'qs'
import range from 'lodash/range'
import { useLocation, useNavigate } from "../../lib/routeUtil";

const eventTabStyles = (invertColors: boolean) => ({
  backgroundColor: invertColors
    ? "var(--tag-bar-event-foreground)"
    : "var(--tag-bar-event-background)",
  color: invertColors
    ? "var(--tag-bar-event-background)"
    : "var(--tag-bar-event-foreground)",
  "&:hover": {
    backgroundColor: invertColors
      ? "var(--tag-bar-event-foreground)"
      : "var(--tag-bar-event-background)",
    color: invertColors
      ? "var(--tag-bar-event-background)"
      : "var(--tag-bar-event-foreground)",
    opacity: 0.9,
  },
});

const styles = (theme: ThemeType) => ({
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
      height: 0,
    },
  },
  leftFade: {
    '&:before': {
      position: 'absolute',
      top: 0,
      left: -1,
      height: '100%',
      width: 50,
      content: '\'\'',
      background: `linear-gradient(to right, ${theme.palette.background.default}, ${theme.palette.background.transparent})`,
      pointerEvents: 'none',
      zIndex: 1,
    },
  },
  rightFade: {
    '&:after': {
      position: 'absolute',
      top: 0,
      right: -1,
      height: '100%',
      width: 50,
      content: '\'\'',
      background: `linear-gradient(to left, ${theme.palette.background.default}, ${theme.palette.background.transparent})`,
      pointerEvents: 'none',
    },
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
    fontSize: 18,
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
    },
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
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.grey[300],
    },
    '@media (max-width: 840px)': {
      fontSize: 12,
      lineHeight: '18px',
      padding: '4px 6px',
    },
  },
  activeTab: {
    backgroundColor: theme.palette.grey[1000],
    color: theme.palette.grey[0],
    '&:hover': {
      backgroundColor: theme.palette.grey[1000],
    },
  },
  eventTab: {
    ...eventTabStyles(theme.themeOptions.name === "dark"),
  },
  activeEventTab: {
    ...eventTabStyles(theme.themeOptions.name !== "dark"),
  },
  placeholderTab: {
    flex: 'none',
    height: 31,
    width: 110,
    background: theme.palette.panelBackground.placeholderGradient,
    backgroundSize: "300% 100%",
    animation: "profile-image-loader 1.8s infinite",
    cursor: 'default',
    '&:hover': {
      background: theme.palette.panelBackground.placeholderGradient,
      backgroundSize: "300% 100%",
    },
    '@media (max-width: 840px)': {
      height: 26,
      width: 100,
    },
  },
  tagDescriptionTooltip: {
    margin: 8,
  }
})

const eventTabProperties = (event?: ForumEventsDisplay): CSSProperties => {
  return event
    ? {
      "--tag-bar-event-background": event.lightColor,
      "--tag-bar-event-foreground": event.darkColor,
    } as CSSProperties
    : {};
}

export type TopicsBarTab = {
  _id: string,
  name: string,
  shortName?: string | null,
  slug?: string,
  description?: TagFragment_description | null,
}

/**
 * A horizontal bar of clickable tabs that can be used to filter content by tag. 
 * By default - displays core tags in order defined by defaultOrder. Used on EA and WakingUP home pages.
 * 
 * @param frontpageTab - Description for "show everything" tab
 * @param sortTopics - you can define custom ordering/additional filtering for the tabs
 */
const HomeTagBar = (
  {
    classes,
    onTagSelectionUpdated,
    frontpageTab,
    sortTopics = (topics: Array<TopicsBarTab>) => topics,
    showDescriptionOnHover = false,
  }: {
    classes: ClassesType<typeof styles>,
    onTagSelectionUpdated: (tab: TopicsBarTab) => void,
    frontpageTab: TopicsBarTab,
    sortTopics?: (topics: Array<TopicsBarTab>) => Array<TopicsBarTab>,
    showDescriptionOnHover?: boolean,
  },
) => {
  const {currentForumEvent} = useCurrentAndRecentForumEvents();

  // we use the widths of the tabs window and the underlying topics bar
  // when calculating how far to scroll left and right
  const tabsWindowRef = useRef<HTMLDivElement | null>(null)
  const topicsBarRef = useRef<HTMLDivElement | null>(null)

  // we store the topic bar scrollLeft offsets that correspond to displaying each "set" of topics
  const offsets = useRef<Array<number>>([0])

  const {results: coreTopics, loading: coreTopicsLoading} = useMulti({
    terms: {view: 'coreTags'},
    collectionName: 'Tags',
    fragmentName: 'TagFragment',
    limit: 40,
  })

  useEffect(() => {
    if (!tabsWindowRef.current || !topicsBarRef.current) return
    offsets.current = [0]
    Array.from(topicsBarRef.current.children).forEach((topic: HTMLElement) => {
      if (!tabsWindowRef.current || !topicsBarRef.current) return
      // we are looking for the topic that would get cut off at the end of each "set",
      // by checking if the right edge would be past the window
      // - if so, this will be the first in the next "set"
      if (topic.offsetLeft + topic.offsetWidth - offsets.current[offsets.current.length - 1] > tabsWindowRef.current.offsetWidth) {
        // subtract 30px to account for the fade on the left side of the tabs window
        offsets.current.push(topic.offsetLeft - 30)
      }
    })
    // coreTopics is a dependency here because we want to recalculate the offsets 
    // when topics are finished fetching (and rendered)
  }, [tabsWindowRef, topicsBarRef, coreTopics])

  const allTabs: TopicsBarTab[] = useMemo(() => {
    const mainTabs = [frontpageTab];
    if (currentForumEvent?.tag) {
      mainTabs.push(currentForumEvent?.tag);
    }
    return [...mainTabs, ...(sortTopics(coreTopics ?? []))];
  }, [coreTopics, sortTopics, frontpageTab, currentForumEvent?.tag]);

  const [activeTab, setActiveTab] = useState<TopicsBarTab>(frontpageTab)
  const [leftArrowVisible, setLeftArrowVisible] = useState(false)
  const [rightArrowVisible, setRightArrowVisible] = useState(true)
  const navigate = useNavigate()
  const {location, query} = useLocation()
  const {captureEvent} = useTracking()

  const updateActiveTab = useCallback((activeTab: TopicsBarTab) => {
    setActiveTab(activeTab)
    onTagSelectionUpdated(activeTab)
  }, [onTagSelectionUpdated])

  useEffect(() => {
    if (coreTopics) {
      // set the initial active tab based on the query,
      // and update the tab if the user clicks on a new one
      const activeTab = coreTopics.find(topic => topic.slug === query.tab)
      if (activeTab) {
        updateActiveTab(activeTab)
      } else if (currentForumEvent?.tag && query.tab === currentForumEvent?.tag?.slug) {
        updateActiveTab(currentForumEvent?.tag);
      } else {
        updateActiveTab(frontpageTab)
      }
    }
  }, [coreTopics, query, updateActiveTab, frontpageTab, currentForumEvent?.tag])

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
      behavior: 'smooth',
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
      behavior: 'smooth',
    })
    setLeftArrowVisible(true)
  }

  const handleTabClick = (tab: TopicsBarTab) => {
    navigate({
      ...location,
      search: qs.stringify({...query, tab: tab.slug}),
    }, {replace: true})
    captureEvent('topicsBarTabClicked', {topicsBarTabId: tab._id, topicsBarTabName: tab.shortName || tab.name})
  }

  const {SingleColumnSection, ForumIcon, LWTooltip} = Components

  return (
    <>
      <AnalyticsContext pageSectionContext="topicsBar">
        <SingleColumnSection className={classes.tabsSection}>
          <div className={classes.tabsRow}>
            {leftArrowVisible && <div onClick={scrollLeft} className={classNames(classes.arrow, classes.leftArrow)}>
              <ForumIcon icon="ThickChevronLeft" className={classes.arrowIcon}/>
            </div>}
            <div className={classNames(classes.tabsWindowContainer, {
              [classes.leftFade]: leftArrowVisible,
              [classes.rightFade]: rightArrowVisible,
            })}>
              <div ref={tabsWindowRef} className={classes.tabsWindow} onScroll={() => updateArrows()}>
                <div ref={topicsBarRef} className={classes.topicsBar}>
                  {allTabs.map(tab => {
                    const tabName = tab.shortName || tab.name
                    const isActive = tab._id === activeTab._id;
                    const isEventTab = tab._id === currentForumEvent?.tag?._id;
                    return <LWTooltip
                      title={showDescriptionOnHover ? tab.description?.plaintextDescription : null}
                      popperClassName={classes.tagDescriptionTooltip}
                      key={tabName}
                    >
                      <button
                        onClick={() => handleTabClick(tab)}
                        className={classNames(classes.tab, {
                          [classes.activeTab]: isActive && !(isEventTab),
                          [classes.eventTab]: isEventTab,
                          [classes.activeEventTab]: isActive && isEventTab,
                        })}
                        style={
                          isEventTab
                            ? eventTabProperties(currentForumEvent)
                            : undefined
                        }
                      >
                        {tabName}
                      </button>
                    </LWTooltip>
                  })}
                  {!coreTopics?.length && coreTopicsLoading && range(0, 6).map(i => {
                    return <div key={i} className={classNames(classes.tab, classes.placeholderTab)}></div>
                  })}
                </div>
              </div>
            </div>
            {rightArrowVisible && <div onClick={scrollRight} className={classNames(classes.arrow, classes.rightArrow)}>
              <ForumIcon icon="ThickChevronRight" className={classes.arrowIcon}/>
            </div>}
          </div>
        </SingleColumnSection>
      </AnalyticsContext>
    </>
  )
}

const HomeTagBarComponent = registerComponent('HomeTagBar', HomeTagBar, {styles})

declare global {
  interface ComponentTypes {
    HomeTagBar: typeof HomeTagBarComponent
  }
}
