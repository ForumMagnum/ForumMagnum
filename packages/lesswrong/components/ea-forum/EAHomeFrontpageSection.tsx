import React, { useEffect, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { AnalyticsContext, captureEvent } from '../../lib/analyticsEvents';
import classNames from 'classnames';
import { tagPostTerms } from '../tagging/TagPage';
import { useMulti } from '../../lib/crud/withMulti';
import debounce from 'lodash/debounce';


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
    '&::-webkit-scrollbar': {
      height: 0
    }
  },
  tabsWindowFade: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: '100%',
    width: 50,
    content: "''",
    background: `linear-gradient(to left, ${theme.palette.background.default}, transparent)`,
    pointerEvents: 'none'
  },
  arrow: {
    position: 'absolute',
    top: 0,
    height: 30,
    width: 28,
    color: theme.palette.grey[600],
    paddingTop: 8,
    paddingLeft: 6,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[900],
    },
    '@media (max-width: 840px)': {
      display: 'none',
    },
  },
  arrowIcon: {
    fontSize: 15
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
    backgroundColor: theme.palette.grey[300],
    color: theme.palette.grey[900],
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '23px',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: 6,
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.grey[400],
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
  }
})

type TopicsBarTab = {
  _id: string,
  name: string,
  shortName?: string|null
}

const EAHomeFrontpageSection = ({classes}:{classes: ClassesType}) => {
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
        offsets.current.push(topic.offsetLeft)
      }
    })
  }, [tabsWindowRef, topicsBarRef])
  
  const { results: coreTopics } = useMulti({
    terms: {view: "coreTags"},
    collectionName: "Tags",
    fragmentName: 'TagBasicInfo',
    limit: 40
  })
  const frontpageTab = {_id: '0', name: 'Frontpage'}
  let allTabs: TopicsBarTab[] = [frontpageTab]
  if (coreTopics) {
    allTabs = allTabs.concat(coreTopics)
  }
  const [activeTab, setActiveTab] = useState(frontpageTab)
  const [leftArrowVisible, setLeftArrowVisible] = useState(false)
  const [rightArrowVisible, setRightArrowVisible] = useState(true)
  
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
      return os < tabsWindowRef.current.scrollLeft
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
  
  const handleTabClick = (tab) => {
    setActiveTab(tab)
    captureEvent("topicsBarTabClicked", {topicsBarTabId: tab._id, topicsBarTabName: tab.shortName || tab.name})
  }
  
  const { SingleColumnSection, ForumIcon, HomeLatestPosts, EAHomeCommunityPosts, SectionTitle, PostsList2 } = Components
  
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
              <ForumIcon icon="ChevronLeft" className={classes.arrowIcon} />
            </div>}
            <div className={classes.tabsWindowContainer}>
              <div ref={tabsWindowRef} className={classes.tabsWindow} onScroll={() => updateArrows()}>
                <div ref={topicsBarRef} className={classes.topicsBar}>
                  {allTabs.map(tab => {
                    const tabName = tab.shortName || tab.name
                    return <button
                      key={tabName}
                      onClick={() => handleTabClick(tab)}
                      className={classNames(classes.tab, {[classes.activeTab]: tab._id === activeTab._id})}
                    >
                      {tabName}
                    </button>
                  })}
                </div>
              </div>
              {rightArrowVisible && <div className={classes.tabsWindowFade}></div>}
            </div>
            {rightArrowVisible && <div onClick={scrollRight} className={classNames(classes.arrow, classes.rightArrow)}>
              <ForumIcon icon="ChevronRight" className={classes.arrowIcon} />
            </div>}
          </div>
        </SingleColumnSection>
      </AnalyticsContext>

      {activeTab.name === 'Frontpage' ? <>
        <HomeLatestPosts />
        <EAHomeCommunityPosts />
      </> : <AnalyticsContext pageSectionContext="topicSpecificPosts">
        <SectionTitle title="New & upvoted" noTopMargin />
        <PostsList2
          terms={topicPostTerms}
          itemsPerPage={30}
          hideTag
        />
      </AnalyticsContext>}
    </>
  )
}

const EAHomeFrontpageSectionComponent = registerComponent('EAHomeFrontpageSection', EAHomeFrontpageSection, {styles});

declare global {
  interface ComponentTypes {
    EAHomeFrontpageSection: typeof EAHomeFrontpageSectionComponent
  }
}
