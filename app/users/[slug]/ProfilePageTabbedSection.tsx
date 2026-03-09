import React, { useState, useRef, Suspense } from "react";
import { SELECTED_PROFILE_TAB_COOKIE } from "@/lib/cookies/cookies";
import { useCookiesWithConsent } from "@/components/hooks/useCookiesWithConsent";
import classNames from 'classnames';
import { useStyles } from "@/components/hooks/useStyles";
import { profileStyles } from "./profileStyles";
import { ProfilePageAllPostsTab } from "./ProfilePageAllPostsTab";
import { ProfilePageSequencesTab } from "./ProfilePageSequencesTab";
import { ProfilePageFeedTab } from "./ProfilePageFeedTab";
import { AllPostsTabSortingMode } from "./ProfilePageAllPostsTab";
import { ProfilePageQuickTakesTab } from "./ProfilePageQuickTakesTab";

type ProfileTab = "posts" | "sequences" | "quickTakes" | "feed";
const SORT_PANEL_CLOSE_MS = 300;

function parseProfileTab(value: unknown): ProfileTab | null {
  if (value === "posts" || value === "sequences" || value === "quickTakes" || value === "feed") {
    return value;
  }
  return null;
}

function getInitialProfileTab({
  preferredTab,
  hasPosts,
  hasSequences,
  hasQuickTakes,
}: {
  preferredTab: ProfileTab | null;
  hasPosts: boolean;
  hasSequences: boolean;
  hasQuickTakes: boolean;
}): ProfileTab {
  if (preferredTab === "sequences" && hasSequences) return "sequences";
  if (preferredTab === "posts" && hasPosts) return "posts";
  if (preferredTab === "quickTakes" && hasQuickTakes) return "quickTakes";
  if (preferredTab === "feed") return "feed";
  if (!hasPosts) return "feed";
  return "posts";
}

function switchTab(
  tab: ProfileTab,
  tabsRef: React.RefObject<HTMLDivElement | null>,
  setActiveTab: (tab: ProfileTab) => void,
) {
  // Preserve scroll position relative to tabs when switching
  const tabsTop = tabsRef.current?.getBoundingClientRect().top ?? 0;
  setActiveTab(tab);
  requestAnimationFrame(() => {
    if (tabsRef.current) {
      const newTabsTop = tabsRef.current.getBoundingClientRect().top;
      window.scrollBy(0, newTabsTop - tabsTop);
    }
  });
}

function toggleSortPanel(
  sortPanelOpen: boolean,
  setSortPanelOpen: (open: boolean) => void,
  setSortPanelClosing: (closing: boolean) => void,
) {
  if (sortPanelOpen) {
    setSortPanelClosing(true);
    setTimeout(() => {
      setSortPanelOpen(false);
      setSortPanelClosing(false);
    }, SORT_PANEL_CLOSE_MS);
  } else {
    setSortPanelOpen(true);
  }
}

export function ProfilePageTabbedSection({user}: {
  user: UsersProfile
}) {
  const [cookies, setCookie] = useCookiesWithConsent([SELECTED_PROFILE_TAB_COOKIE]);
  const hasPosts = user.postCount > 0;
  const hasFeedContent = hasPosts || (user?.commentCount ?? 0) > 0;
  const hasSequences = user.sequenceCount > 0;
  const hasQuickTakes = !!user.shortformFeedId;

  const [activeTab, setActiveTab] = useState<ProfileTab>(getInitialProfileTab({
    preferredTab: parseProfileTab(cookies[SELECTED_PROFILE_TAB_COOKIE]),
    hasPosts: user.postCount > 0,
    hasSequences: user.sequenceCount > 0,
    hasQuickTakes,
  }));

  const [sortPanelOpen, setSortPanelOpen] = useState(false);
  const [sortPanelClosing, setSortPanelClosing] = useState(false);
  const [sortBy, setSortBy] = useState<AllPostsTabSortingMode>("new");
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleTabSwitch = (tab: ProfileTab) => {
    setCookie(SELECTED_PROFILE_TAB_COOKIE, tab, { path: "/" });
    switchTab(tab, tabsRef, setActiveTab);
  };
  const handleSortPanelToggle = () => toggleSortPanel(sortPanelOpen, setSortPanelOpen, setSortPanelClosing);

  const classes = useStyles(profileStyles);

  return <div className={classes.allPostsLeftColumn}>
    <div className={classes.allPostsHeader} ref={tabsRef}>
      <div className={classes.allPostsLeftHeader}>
        <div className={classes.profileTabs}>
          <button
            className={classNames(classes.profileTab, activeTab === "posts" && classes.profileTabActive)}
            data-tab="posts"
            type="button"
            onClick={() => handleTabSwitch("posts")}
          >
            Posts
          </button>
          {hasSequences && (
            <button
              className={classNames(classes.profileTab, activeTab === "sequences" && classes.profileTabActive)}
              data-tab="sequences"
              type="button"
              onClick={() => handleTabSwitch("sequences")}
            >
              Sequences
            </button>
          )}
          {hasQuickTakes && (
            <button
              className={classNames(classes.profileTab, activeTab === "quickTakes" && classes.profileTabActive)}
              data-tab="quickTakes"
              type="button"
              onClick={() => handleTabSwitch("quickTakes")}
            >
              Quick takes
            </button>
          )}
          <button
            className={classNames(classes.profileTab, activeTab === "feed" && classes.profileTabActive)}
            data-tab="feed"
            type="button"
            onClick={() => handleTabSwitch("feed")}
          >
            All
          </button>
        </div>
        {((activeTab === "posts" && hasPosts) || (activeTab === "feed" && hasFeedContent) || activeTab === "sequences") && (
          <div className={classes.sortControl}>
            <button 
              className={classNames(classes.sortIconButton, activeTab === "sequences" && classes.sortIconDisabled)}
              onClick={activeTab !== "sequences" ? handleSortPanelToggle : undefined}
              type="button"
            >
              <span className={classes.sortIcon}>⚙</span>
            </button>
          </div>
        )}
      </div>
    </div>

    <div className={classes.allPostsContainer}>
      <div className={classNames(classes.postsList, classes.tabPanel, activeTab === "posts" && classes.tabPanelActive)}>
        <Suspense>
          <ProfilePageAllPostsTab user={user} sortBy={sortBy} setSortBy={setSortBy} sortPanelOpen={sortPanelOpen} sortPanelClosing={sortPanelClosing} />
        </Suspense>
      </div>

      <div className={classNames(
        classes.sequencesList, classes.tabPanel,
        activeTab === "sequences" && classes.tabPanelActive
      )}>
        {activeTab === "sequences" && <Suspense>
          <ProfilePageSequencesTab user={user} />
        </Suspense>}
      </div>

      <div className={classNames(
        classes.tabPanel,
        activeTab === "quickTakes" && classes.tabPanelActive
      )}>
        {activeTab === "quickTakes" && <Suspense>
          <ProfilePageQuickTakesTab user={user} />
        </Suspense>}
      </div>

      <div className={classNames(
        classes.feedList,
        classes.tabPanel,
        activeTab === "feed" && classes.tabPanelActive
      )}>
        {activeTab === "feed" && <Suspense>
          <ProfilePageFeedTab user={user} sortPanelOpen={sortPanelOpen} sortPanelClosing={sortPanelClosing} />
        </Suspense>}
      </div>
    </div>
    </div>
}
