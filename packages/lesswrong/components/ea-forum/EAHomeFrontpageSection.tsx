import React, { useEffect, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { AnalyticsContext, captureEvent } from '../../lib/analyticsEvents';
import classNames from 'classnames';
import { tagPostTerms } from '../tagging/TagPage';
import { useMulti } from '../../lib/crud/withMulti';
import debounce from 'lodash/debounce';


const styles = (theme: ThemeType): JssStyles => ({
  tabsSection: {
    marginBottom: 26
  },
  tabsRow: {
    position: 'relative',
    [theme.breakpoints.down('sm')]: {
      padding: '0 28px',
      marginTop: 20,
      marginLeft: -8,
      marginRight: -8
    },
  },
  tabsWindow: {
    position: 'relative',
    overflow: 'hidden',
  },
  tabsWindowFade: {
    '&::after': {
      position: 'absolute',
      top: 0,
      right: 0,
      height: '100%',
      width: 50,
      content: "''",
      background: `linear-gradient(to left, ${theme.palette.background.default}, transparent)`,
    }
  },
  arrow: {
    position: 'absolute',
    top: 4,
    color: theme.palette.grey[600],
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[800],
    },
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  arrowMobile: {
    display: 'none',
    [theme.breakpoints.down('sm')]: {
      display: 'block',
      position: 'absolute',
      top: 0,
      color: theme.palette.grey[600],
      cursor: 'pointer',
    }
  },
  leftArrow: {
    left: -33,
  },
  leftArrowMobile: {
    [theme.breakpoints.down('sm')]: {
      left: 0,
      width: 28
    }
  },
  rightArrow: {
    right: -33,
  },
  rightArrowMobile: {
    [theme.breakpoints.down('sm')]: {
      right: 0,
      width: 28
    }
  },
  disabledArrow: {
    color: theme.palette.grey[300],
    cursor: 'default'
  },
  topicsBar: {
    display: 'flex',
    columnGap: 8,
    whiteSpace: 'nowrap',
    transition: 'transform 0.2s ease',
    [theme.breakpoints.down('sm')]: {
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
    [theme.breakpoints.down('sm')]: {
      fontSize: 12,
      lineHeight: '18px',
      padding: '3px 6px',
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

  // we store the topic bar offsets that correspond to displaying each "set" of topics
  const offsets = useRef<Array<number>>([0])
  // we calculate the offsets when the page loads, and when the tabs window resizes
  const resizeObserver = useRef<ResizeObserver|null>(null)
  
  const recalculateOffsets = debounce((topicsBarElem: HTMLDivElement, tabsWindowElem: HTMLElement) => {
    // first reset the offsets list
    offsets.current = [0]
    Array.from(topicsBarElem.children).forEach((topic: HTMLElement) => {
      // we are looking for the topic that would get cut off at the end of each "set",
      // by checking if the right edge would be past the window
      // - if so, this will be the first in the next "set"
      if (topic.offsetLeft + topic.offsetWidth - offsets.current[offsets.current.length-1] > tabsWindowElem.clientWidth) {
        offsets.current.push(topic.offsetLeft)
      }
    })
  }, 300)

  useEffect(() => {
    if (!tabsWindowRef.current || !topicsBarRef.current) return
    
    resizeObserver.current = new ResizeObserver(elements => {
      if (!topicsBarRef.current) return
      recalculateOffsets(topicsBarRef.current, elements[0].target)
    })
    resizeObserver.current.observe(tabsWindowRef.current)

    return () => resizeObserver.current?.disconnect()
  }, [tabsWindowRef, topicsBarRef, recalculateOffsets])
  
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
  const [currentOffset, setCurrentOffset] = useState(0)
  const [rightArrowVisible, setRightArrowVisible] = useState(true)
  
  const scrollLeft = () => {
    if (!tabsWindowRef.current || !topicsBarRef.current) return
    // look for the offset that is to the left of us
    setCurrentOffset(Array.from(offsets.current).reverse().find(os => os < currentOffset) || 0)
    // make sure the right arrow is visible/enabled
    setRightArrowVisible(true)
  }
  
  const scrollRight = () => {
    if (!tabsWindowRef.current || !topicsBarRef.current) return
    // look for the offset that is to the right of us
    const nextOffset = offsets.current.find(os => os > currentOffset) || currentOffset
    setCurrentOffset(nextOffset)
    // if this is the last time we can move to the right, hide/disable the right arrow
    if (!offsets.current.some(os => os > nextOffset)) {
      setRightArrowVisible(false)
    }
  }
  
  const handleTabClick = (tab) => {
    setActiveTab(tab)
    captureEvent("topicsBarTabClicked", {topicsBarTabId: tab._id, topicsBarTabName: tab.shortName || tab.name})
  }
  
  const { SingleColumnSection, ForumIcon, PostsList2, HomeLatestPosts } = Components
  
  const topicPostTerms = {
    ...tagPostTerms(activeTab, {}),
    sortedBy: 'magic',
    limit: 15
  }
  
  // the left arrow is visible/enabled if we have scrolled right at all
  const leftArrowVisible = currentOffset > 0

  return (
    <>
      <AnalyticsContext pageSectionContext="topicsBar">
        <SingleColumnSection className={classes.tabsSection}>
          <div className={classes.tabsRow}>
            {leftArrowVisible && <div onClick={scrollLeft} className={classNames(classes.arrow, classes.leftArrow)}>
              <ForumIcon icon="ChevronLeft" />
            </div>}
            <div onClick={scrollLeft} className={classNames(classes.arrowMobile, classes.leftArrowMobile, {[classes.disabledArrow]: !leftArrowVisible})}>
              <ForumIcon icon="ChevronLeft" />
            </div>
            <div ref={tabsWindowRef} className={classNames(classes.tabsWindow, {[classes.tabsWindowFade]: rightArrowVisible})}>
              <div ref={topicsBarRef} className={classes.topicsBar} style={{transform: `translatex(-${currentOffset}px)`}}>
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
            <div onClick={scrollRight} className={classNames(classes.arrowMobile, classes.rightArrowMobile, {[classes.disabledArrow]: !rightArrowVisible})}>
              <ForumIcon icon="ChevronRight" />
            </div>
            {rightArrowVisible && <div onClick={scrollRight} className={classNames(classes.arrow, classes.rightArrow)}>
              <ForumIcon icon="ChevronRight" />
            </div>}
          </div>
        </SingleColumnSection>
      </AnalyticsContext>

      {activeTab.name === 'Frontpage' ? <HomeLatestPosts /> : <AnalyticsContext pageSectionContext="topicSpecificPosts">
        <PostsList2
          terms={topicPostTerms}
          enableTotal
          itemsPerPage={15}
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
