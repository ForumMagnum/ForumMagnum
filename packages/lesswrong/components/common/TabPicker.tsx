import React, { useCallback, useEffect, useRef, useState} from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components'
import classNames from 'classnames'
import LWTooltip from "./LWTooltip";
import SingleColumnSection from "./SingleColumnSection";
import ForumIcon from "./ForumIcon";
import { isIfAnyoneBuildsItFrontPage } from '../seasonal/IfAnyoneBuildsItSplash';

const rightFadeStyle = (theme: ThemeType) => ({
  '&:after': {
    position: 'absolute',
    top: 0,
    right: -1,
    height: '100%',
    width: 50,
    content: '\'\'',
    background: `linear-gradient(to left, ${theme.palette.background.default}, ${theme.palette.background.transparent})`,
    ...isIfAnyoneBuildsItFrontPage({
      background: 'none',
    }),
    pointerEvents: 'none',
  },
});

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
    overflowX: 'scroll',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      height: 0,
    },
    transition: 'transform 0.2s ease',
  },
  tabsWindowContainer: {
    position: 'relative',
  },
  tabsWindow: {
    position: 'relative',
  },
  leftFade: {
    '&:before': {
      position: 'absolute',
      top: 0,
      left: -1,
      height: '100%',
      width: 50,
      content: '\'\'',
      // FIXME: This will look broken if it appears on top of an image. It is
      // currently the case that it will never appear on top of an image in
      // production, because the tab bar doesn't have enough tabs in it to
      // overflow unless you're on a phone where there is no background image
      // anyways, but that could change if mobile screen widths ever get a
      // background image or if we add more tabs.
      // This is load-bearing UX because otherwise the fact that the tabs have
      // horizontal scroll might not be detectable.
      background: `linear-gradient(to left, ${theme.palette.background.default}, ${theme.palette.background.transparent})`,
      ...isIfAnyoneBuildsItFrontPage({
        background: 'none',
      }),
      pointerEvents: 'none',
      zIndex: 1,
    },
  },
  rightFade: {
    ...rightFadeStyle(theme),
  },
  rightFadeMobile: {
    [theme.breakpoints.down('xs')]: {
      ...rightFadeStyle(theme),
    },
  },
  /**
   * These two breakpoints were determined by trial-and-error after adding the following:
   * - n tabs * 100px (their minWidth on mobile, assuming none of them have names that would cause them to be longer than that)
   * - (n - 1) tabs * 8px columnGap
   * - 29px for the settings gear icon
   * - 10px marginRight on the tabPicker (in LWHomePosts)
   * - 16px for 8x left & right padding on the sides of the screen from Layout
   * - 7 px for labs icon on Recommendations tab
   * 
   * This gives breakpoints of 378px for 3 tabs and 486px for 4 tabs
   */
  rightFadeThreeTabs: {
    '@media(max-width: 378px)': {
      ...rightFadeStyle(theme),
    },
  },
  rightFadeFourTabs: {
    '@media(max-width: 486px)': {
      ...rightFadeStyle(theme),
    },
  },
  tab: {
    display: 'flex',
    justifyContent: 'center',
    minWidth: '120px',
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '23px',
    fontWeight: '500',
    padding: '4px 8px',
    borderRadius: 3,
    cursor: 'pointer',
    [theme.breakpoints.down('xs')]: {
      fontSize: 13,
      padding: '3px 6px',
      minWidth: '100px',
    }
  },
  inactiveTab: {
    ...(theme.dark ? {
      backgroundColor: theme.palette.tab.inactive.bannerAdBackground,
      backdropFilter: theme.palette.filters.bannerAdBlurMedium,
      color: theme.palette.text.bannerAdOverlay,
    } : {
      backgroundColor: theme.palette.panelBackground.default,
      color: theme.palette.tab.inactive.text,
    }),
    '&:hover': {
      color: theme.palette.tab.inactive.hover.text
    },
  },
  activeTab: {
    backgroundColor: theme.palette.tab.active.background,
    color: theme.palette.text.alwaysWhite,
    backdropFilter: theme.palette.filters.bannerAdBlurMedium,
    '&:hover': {
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
    [theme.breakpoints.down('xs')]: {
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
  labsIcon: {
    marginLeft: 3,
    alignSelf: 'center',
    height: 14,
    width: 14,
    [theme.breakpoints.down('xs')]: {
      height: 13,
      width: 13,
    }
  },
  sparkleIcon: {
    marginLeft: 3,
    alignSelf: 'center',
    height: 18,
    width: 18,
    [theme.breakpoints.down('xs')]: {
      height: 13,
      width: 13,
    }
  },
  personIcon: {
    position: 'relative',
    top: 1,
    marginLeft: 2,
    alignSelf: 'center',
    height: 16,
    width: 16,
  }
})

export interface TabRecord {
  name: string,
  label: string,
  description?: string,
  disabled?: boolean,
  isAdminOnly?: boolean,
  showLabsIcon?: boolean,
  showSparkleIcon?: boolean,
  showPersonIcon?: boolean,
  isInfiniteScroll?: boolean,
  defaultTab?: boolean
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
  const [activeTab, setActiveTab] = useState<T[number]['name']>(defaultTab ?? sortedTabs[0].name);

  // we use the widths of the tab list container when calculating how far to scroll left and right
  const tabsListRef = useRef<HTMLDivElement | null>(null);

  // we store the tab list scrollLeft offsets that correspond to displaying each "set" of tabs
  const offsets = useRef<Array<number>>([0]);

  const [leftArrowVisible, setLeftArrowVisible] = useState(false);
  const [rightArrowVisible, setRightArrowVisible] = useState(false);
  // We have the unfortunate situation where we want the right arrow + fade to be visible on mobile by default,
  // since the tabs will be too wide to display in full, while not being visible on wider screens, during SSR.
  // We also want the arrows to behave correctly after the user does any scrolling.  So we do the following:
  // 1. Default `rightArrowVisible` to false, which controls the `rightFade` class.
  // 2. Record whether the user has ever manually scrolled on the tab bar, which informs the `rightFade${Three|Four}Tabs` classes.
  //    Those classes ensure that users on mobile have a rightFade + arrow by default until they scroll if they have enough tabs to justify it.
  // NOTE: If we implement enough tabs that we'll have scrolling on desktops as well, we can get rid of all of this and just switch the `rightArrowVisible` default back to true
  const [everScrolled, setEverScrolled] = useState(false);

  /**
   * When the tabs bar is scrolled, hide/show the left/right arrows as necessary.
   */
  const updateArrows = useCallback(() => {
    if (!tabsListRef.current) return;

    const currentScrollLeft = tabsListRef.current.scrollLeft;
    // max amount we can scroll to the right, reduced a bit to make sure that
    // we hide the right arrow when scrolled all the way to the right
    const maxScrollLeft = tabsListRef.current.scrollWidth - tabsListRef.current.clientWidth;

    setLeftArrowVisible(currentScrollLeft > 0);
    setRightArrowVisible(currentScrollLeft < maxScrollLeft);
    setEverScrolled(true);
  }, []);

  useEffect(() => {
    if (!tabsListRef.current) return;
    offsets.current = [0];
    Array.from(tabsListRef.current.children).forEach((tab: HTMLElement) => {
      if (!tabsListRef.current) return;
      // we are looking for the tab that would get cut off at the end of each "set",
      // by checking if the right edge would be past the window
      // - if so, this will be the first in the next "set"
      if (tab.offsetLeft + tab.offsetWidth - offsets.current[offsets.current.length - 1] > tabsListRef.current.offsetWidth) {
        // subtract 30px to account for the fade on the left side of the tabs window
        offsets.current.push(tab.offsetLeft - 30);
      }
    });

    // updateArrows();
  }, [tabsListRef, updateArrows, sortedTabs]);

  const updateActiveTab = useCallback((activeTab: T[number]['name']) => {
    setActiveTab(activeTab)
    onTabSelectionUpdate(activeTab)
  }, [onTabSelectionUpdate]);

  /**
   * Clicking the left arrow smooth scrolls us to the previous offset (or defaults to 0).
   */
  const scrollLeft = () => {
    if (!tabsListRef.current) return;
    // look for the offset that is to the left of us
    const nextOffset = Array.from(offsets.current).reverse().find(os => {
      if (!tabsListRef.current) return false;
      return os < (tabsListRef.current.scrollLeft - 2);
    }) || 0;

    tabsListRef.current.scrollTo({
      left: nextOffset,
      behavior: 'smooth',
    });
    setRightArrowVisible(true);
    setEverScrolled(true);
  };

  /**
   * Clicking the right arrow smooth scrolls us to the next offset (if one exists).
   */
  const scrollRight = () => {
    if (!tabsListRef.current) return;
    // look for the offset that is to the right of us
    const nextOffset = offsets.current.find(os => {
      if (!tabsListRef.current) return false;
      return os > tabsListRef.current.scrollLeft;
    });

    if (!nextOffset) return;
    tabsListRef.current.scrollTo({
      left: nextOffset,
      behavior: 'smooth',
    });
    setLeftArrowVisible(true);
    setEverScrolled(true);
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
          [classes.rightFadeThreeTabs]: sortedTabs.length === 3 && !everScrolled,
          [classes.rightFadeFourTabs]: sortedTabs.length === 4 && !everScrolled,
        })}>
          <div ref={tabsListRef} className={classes.topicsBar} onScroll={() => updateArrows()}>
            {sortedTabs.map(tab => {
              const isActive = tab.name === activeTab;
              return <LWTooltip
                title={showDescriptionOnHover ? tab.description : null} 
                popperClassName={classes.tagDescriptionTooltip}
                key={tab.name}
                hideOnTouchScreens
              >
                <button
                  onClick={() => updateActiveTab(tab.name)}
                  className={classNames(classes.tab, { [classes.activeTab]: isActive, [classes.inactiveTab]: !isActive })}
                >
                  {tab.label}
                  {tab.showLabsIcon && <ForumIcon icon="LabBeaker" className={classes.labsIcon} />}
                  {tab.showSparkleIcon && <ForumIcon icon="Sparkle" className={classes.sparkleIcon} />}
                  {tab.showPersonIcon && <ForumIcon icon="User" className={classes.personIcon} />}
                </button>
              </LWTooltip>
            })}
          </div>
        </div>
        {rightArrowVisible && <div onClick={scrollRight} className={classNames(classes.arrow, classes.rightArrow)}>
          <ForumIcon icon="ThickChevronRight" className={classes.arrowIcon}/>
        </div>}
      </div>
    </SingleColumnSection>
  );
}

export default registerComponent('TabPicker', TabPicker, {styles});


