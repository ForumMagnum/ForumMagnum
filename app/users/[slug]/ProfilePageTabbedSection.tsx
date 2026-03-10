import React, { useState, useRef, Suspense } from "react";
import { SELECTED_PROFILE_TAB_COOKIE } from "@/lib/cookies/cookies";
import { useCookiesWithConsent } from "@/components/hooks/useCookiesWithConsent";
import classNames from 'classnames';
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { profileStyles } from "./profileStyles";
import { ProfilePageAllPostsTab } from "./ProfilePageAllPostsTab";
import { ProfilePageSequencesTab } from "./ProfilePageSequencesTab";
import { ProfilePageFeedTab } from "./ProfilePageFeedTab";
import { AllPostsTabSortingMode } from "./ProfilePageAllPostsTab";
import { ProfilePageQuickTakesTab } from "./ProfilePageQuickTakesTab";
import { postsItemLikeStyles } from "@/components/localGroups/LocalGroupsItem";

const profilePageTabbedSectionUnsharedStyles = defineStyles("ProfilePageTabbedSectionUnshared", (theme: ThemeType) => ({
  allPostsLeftColumn: {
    flex: "1 1 0%",
    minWidth: 0,
    minHeight: "100vh",
    "@media (max-width: 630px)": {
      flex: "1 1 auto",
    },
  },
  allPostsHeader: {
    marginBottom: 6,
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    "@media (max-width: 630px)": {
      display: "flex",
      flexDirection: "column",
      gap: 0,
    },
  },
  allPostsLeftHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    width: "100%",
    "@media (max-width: 630px)": {
      width: "100%",
      marginBottom: 16,
    },
  },
  profileTabs: {
    display: "flex",
    gap: 22,
    margin: 0,
  },
  profileTab: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    fontWeight: 400,
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    color: theme.palette.text.dim,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    transition: "color 0.2s",
    "&:hover": {
      color: theme.palette.text.normal,
    },
  },
  profileTabActive: {
    color: theme.palette.text.normal,
    fontWeight: 600,
  },
  sortControl: {
    display: "flex",
    alignItems: "start",
    gap: 8,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.palette.text.dim60,
    position: "relative",
  },
  sortIconButton: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    display: "flex",
    alignItems: "start",
    lineHeight: 1,
    color: "inherit",
  },
  sortIconDisabled: {
    opacity: 0.35,
    cursor: "default",
  },
  sortIcon: {
    fontSize: 16,
    lineHeight: 1,
  },
  allPostsContainer: {
    "@media (max-width: 630px)": {
      display: "flex",
      flexDirection: "column",
      gap: 30,
    },
  },
  postsList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    paddingTop: 12,
    "@media (max-width: 630px)": {
      width: "100%",
    },
  },
  tabPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    animation: "$slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    "@media (max-width: 630px)": {
      order: 1,
    },
  },
  sequencesList: {
    paddingTop: 20,
  },
  feedList: {
    "& .UserContentFeed-feedContent": {
      marginLeft: 0,
      marginRight: 0,
    },
  },
}));

const tabs = [
  {
    id: "posts",
    label: "Posts",
  },
  {
    id: "sequences",
    label: "Sequences",
  },
  {
    id: "quickTakes",
    label: "Quick takes",
  },
  {
    id: "feed",
    label: "All",
  },
] as const;

type ProfileTab = (typeof tabs)[number]["id"];
const SORT_PANEL_CLOSE_MS = 300;

function parseProfileTab(value: string): ProfileTab | null {
  if (typeof value !== "string") return null;
  const tab = tabs.find((tab) => tab.id === value);
  if (tab) return tab.id;
  return null;
}

function getInitialProfileTab({
  preferredTab,
  availableTabs,
}: {
  preferredTab: ProfileTab | null;
  availableTabs: ProfileTab[],
}): ProfileTab {
  if (preferredTab && availableTabs.includes(preferredTab)) {
    return preferredTab;
  }
  if (availableTabs.includes("posts")) {
    return "posts";
  }
  return availableTabs[0] ?? "feed";
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
  const availableTabs: ProfileTab[] = [
    ...(hasPosts ? ["posts"] as const : []),
    ...(hasSequences ? ["sequences"] as const : []),
    ...(hasQuickTakes ? ["quickTakes"] as const : []),
    "feed"
  ];
  const [activeTab, setActiveTab] = useState<ProfileTab>(getInitialProfileTab({
    preferredTab: parseProfileTab(cookies[SELECTED_PROFILE_TAB_COOKIE]),
    availableTabs,
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

  const classes = useStyles(profilePageTabbedSectionUnsharedStyles);

  return <div className={classes.allPostsLeftColumn}>
    <div className={classes.allPostsHeader} ref={tabsRef}>
      <div className={classes.allPostsLeftHeader}>
        <div className={classes.profileTabs}>
          {tabs.map((tab) => availableTabs.includes(tab.id) && (
            <button
              key={tab.id}
              className={classNames(classes.profileTab, activeTab === tab.id && classes.profileTabActive)}
              data-tab={tab.id}
              type="button"
              onClick={() => handleTabSwitch(tab.id)}
            >
              {tab.label}
            </button>
          ))}
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

    <Suspense>
      <div className={classes.allPostsContainer}>
        {activeTab === "posts" && <div className={classNames(classes.postsList, classes.tabPanel)}>
          <ProfilePageAllPostsTab user={user} sortBy={sortBy} setSortBy={setSortBy} sortPanelOpen={sortPanelOpen} sortPanelClosing={sortPanelClosing} />
        </div>}

        {activeTab === "sequences" && <div className={classNames(classes.sequencesList, classes.tabPanel)}>
          <ProfilePageSequencesTab user={user} />
        </div>}

        {activeTab === "quickTakes" && <div className={classes.tabPanel}>
          <ProfilePageQuickTakesTab user={user} />
        </div>}

        {activeTab === "feed" && <div className={classNames(classes.feedList, classes.tabPanel)}>
          <ProfilePageFeedTab user={user} sortPanelOpen={sortPanelOpen} sortPanelClosing={sortPanelClosing} />
        </div>}
      </div>
    </Suspense>
  </div>
}
