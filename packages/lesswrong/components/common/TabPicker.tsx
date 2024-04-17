import React, { useCallback, useEffect, useRef, useState} from 'react'
import {Components, registerComponent} from '../../lib/vulcan-lib'
import {AnalyticsContext, useTracking} from '../../lib/analyticsEvents.tsx'
import classNames from 'classnames'
import debounce from 'lodash/debounce'

const styles = (theme: ThemeType) => ({
  tabsSection: {
    margin: 0,
    width: 'inherit',
  },
  tabsRow: {
    position: 'relative',
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
  tab: {
    width: '140px',
    backgroundColor: theme.palette.panelBackground.default,
    color: theme.palette.tab.inactive.text,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '23px',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: 3,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.tab.inactive.hover.text
    },

    '@media (max-width: 840px)': {
      padding: '4px 6px',
    },
  },
  activeTab: {
    backgroundColor: theme.palette.tab.active.background,
    color: theme.palette.tab.active.text,
    '&:hover': {
      color: theme.palette.tab.active.text,
      backgroundColor: theme.palette.tab.active.hover.background
    },
  },
  tagDescriptionTooltip: {
    margin: 8,
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
})

export interface TabRecord {
  name: string,
  label: string,
  description?: string,
  disabled?: boolean,
}

/**
 * A horizontal bar of clickable tabs as alternative to a dropdown
 */
const TabPicker = <T extends TabRecord[]>(
  {
    classes,
    sortedTabs,
    defaultTab,
    onTabSelectionUpdate,
    showDescriptionOnHover = false,
  }: {
    classes: ClassesType<typeof styles>,
    sortedTabs: T,
    defaultTab?: T[number]['name'],
    onTabSelectionUpdate: (tab: T[number]['name']) => void,
    showDescriptionOnHover?: boolean,
  },
) => {
  const { LWTooltip, SingleColumnSection, ForumIcon } = Components;

  const [activeTab, setActiveTab] = useState<T[number]['name']>(defaultTab ?? sortedTabs[0].name);

  // we use the widths of the tabs window and the underlying tab list container
  // when calculating how far to scroll left and right
  const tabsWindowRef = useRef<HTMLDivElement | null>(null);
  const tabsListRef = useRef<HTMLDivElement | null>(null);

  // we store the tab list scrollLeft offsets that correspond to displaying each "set" of tabs
  const offsets = useRef<Array<number>>([0]);

  const [leftArrowVisible, setLeftArrowVisible] = useState(false);
  const [rightArrowVisible, setRightArrowVisible] = useState(false);

  /**
   * When the tabs bar is scrolled, hide/show the left/right arrows as necessary.
   */
  const updateArrows = debounce(() => {
    if (!tabsWindowRef.current || !tabsListRef.current) return;

    const currentScrollLeft = tabsWindowRef.current.scrollLeft;
    // max amount we can scroll to the right, reduced a bit to make sure that
    // we hide the right arrow when scrolled all the way to the right
    const maxScrollLeft = tabsListRef.current.scrollWidth - tabsWindowRef.current.clientWidth - 10;

    setLeftArrowVisible(currentScrollLeft > 0);
    setRightArrowVisible(currentScrollLeft < maxScrollLeft);
  }, 80);

  useEffect(() => {
    if (!tabsWindowRef.current || !tabsListRef.current) return;
    offsets.current = [0];
    Array.from(tabsListRef.current.children).forEach((tab: HTMLElement) => {
      if (!tabsWindowRef.current || !tabsListRef.current) return;
      // we are looking for the tab that would get cut off at the end of each "set",
      // by checking if the right edge would be past the window
      // - if so, this will be the first in the next "set"
      if (tab.offsetLeft + tab.offsetWidth - offsets.current[offsets.current.length - 1] > tabsWindowRef.current.offsetWidth) {
        // subtract 30px to account for the fade on the left side of the tabs window
        offsets.current.push(tab.offsetLeft - 30);
      }
    });

    updateArrows();
  }, [tabsWindowRef, tabsListRef, updateArrows, sortedTabs]);

  const updateActiveTab = useCallback((activeTab: T[number]['name']) => {
    setActiveTab(activeTab)
    onTabSelectionUpdate(activeTab)
  }, [onTabSelectionUpdate]);

  /**
   * Clicking the left arrow smooth scrolls us to the previous offset (or defaults to 0).
   */
  const scrollLeft = () => {
    if (!tabsWindowRef.current || !tabsListRef.current) return;
    // look for the offset that is to the left of us
    const nextOffset = Array.from(offsets.current).reverse().find(os => {
      if (!tabsWindowRef.current || !tabsListRef.current) return false;
      return os < (tabsWindowRef.current.scrollLeft - 2);
    }) || 0;

    tabsWindowRef.current.scrollTo({
      left: nextOffset,
      behavior: 'smooth',
    });
    setRightArrowVisible(true);
  };

  /**
   * Clicking the right arrow smooth scrolls us to the next offset (if one exists).
   */
  const scrollRight = () => {
    if (!tabsWindowRef.current || !tabsListRef.current) return;
    // look for the offset that is to the right of us
    const nextOffset = offsets.current.find(os => {
      if (!tabsWindowRef.current || !tabsListRef.current) return false;
      return os > tabsWindowRef.current.scrollLeft;
    });

    if (!nextOffset) return;
    tabsWindowRef.current.scrollTo({
      left: nextOffset,
      behavior: 'smooth',
    });
    setLeftArrowVisible(true);
  };

  return (
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
            <div ref={tabsListRef} className={classes.topicsBar}>
              {sortedTabs.map(tab => {
                const isActive = tab.name === activeTab;
                return <LWTooltip
                  title={showDescriptionOnHover ? tab.description : null} 
                  popperClassName={classes.tagDescriptionTooltip}
                  key={tab.name}
                >
                  <button
                    onClick={() => updateActiveTab(tab.name)}
                    className={classNames(classes.tab, { [classes.activeTab]: isActive })}
                  >
                    {tab.label}
                  </button>
                </LWTooltip>
              })}
            </div>
          </div>
        </div>
        {rightArrowVisible && <div onClick={scrollRight} className={classNames(classes.arrow, classes.rightArrow)}>
          <ForumIcon icon="ThickChevronRight" className={classes.arrowIcon}/>
        </div>}
      </div>
    </SingleColumnSection>
  );
}

const TabPickerComponent = registerComponent('TabPicker', TabPicker, {styles})

declare global {
  interface ComponentTypes {
    TabPicker: typeof TabPickerComponent
  }
}
