import React, { useEffect, useRef, Suspense, useState } from "react";
import { PROFILE_TAB_SETTINGS_COOKIE, SELECTED_PROFILE_TAB_COOKIE } from "@/lib/cookies/cookies";
import { useCookiesWithConsent } from "@/components/hooks/useCookiesWithConsent";
import classNames from 'classnames';
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { profileStyles } from "./profileStyles";
import {
  defaultProfilePageAllPostsTabSettings,
  ProfilePageAllPostsTabContents,
  ProfilePageAllPostsTabSettings,
  ProfilePageAllPostsTabSettingsForm,
  profilePageAllPostsTabSettingsSchema,
} from "./ProfilePageAllPostsTab";
import {
  defaultProfilePageSequencesTabSettings,
  ProfilePageSequencesTabContents,
  ProfilePageSequencesTabSettings,
  ProfilePageSequencesTabSettingsForm,
  profilePageSequencesTabSettingsSchema,
} from "./ProfilePageSequencesTab";
import {
  defaultProfilePageCommentsTabSettings,
  ProfilePageCommentsTabContents,
  ProfilePageCommentsTabSettings,
  ProfilePageCommentsTabSettingsForm,
  profilePageCommentsTabSettingsSchema,
} from "./ProfilePageCommentsTab";
import {
  defaultProfilePageWikiEditsTabSettings,
  ProfilePageWikiEditsTabContents,
  ProfilePageWikiEditsTabSettings,
  ProfilePageWikiEditsTabSettingsForm,
  profilePageWikiEditsTabSettingsSchema,
} from "./ProfilePageWikiEditsTab";
import {
  defaultProfilePageFeedTabSettings,
  ProfilePageFeedTabContents,
  ProfilePageFeedTabSettings,
  ProfilePageFeedTabSettingsForm,
  profilePageFeedTabSettingsSchema,
} from "./ProfilePageFeedTab";
import {
  defaultProfilePageQuickTakesTabSettings,
  ProfilePageQuickTakesTabContents,
  ProfilePageQuickTakesTabSettings,
  ProfilePageQuickTakesTabSettingsForm,
  profilePageQuickTakesTabSettingsSchema,
} from "./ProfilePageQuickTakesTab";
import { z } from "zod";

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
}));

type ProfileTab = "posts" | "comments" | "wikiEdits" | "sequences" | "quickTakes" | "feed";
const SORT_PANEL_CLOSE_MS = 300;

interface ProfilePageTabSettingsByTab {
  posts: ProfilePageAllPostsTabSettings;
  comments: ProfilePageCommentsTabSettings;
  wikiEdits: ProfilePageWikiEditsTabSettings;
  sequences: ProfilePageSequencesTabSettings;
  quickTakes: ProfilePageQuickTakesTabSettings;
  feed: ProfilePageFeedTabSettings;
}

interface ProfilePageTabDefinition<T extends ProfileTab> {
  id: T;
  label: string;
  isAvailable: (user: UsersProfile) => boolean;
  defaultSettings: ProfilePageTabSettingsByTab[T];
  showSettingsButton: boolean;
  settingsButtonDisabled?: boolean;
  useMultiColumnSettingsPanel?: boolean;
}

const postsTab: ProfilePageTabDefinition<"posts"> = {
  id: "posts",
  label: "Posts",
  isAvailable: (user) => user.postCount > 0,
  defaultSettings: defaultProfilePageAllPostsTabSettings,
  showSettingsButton: true,
};

const sequencesTab: ProfilePageTabDefinition<"sequences"> = {
  id: "sequences",
  label: "Sequences",
  isAvailable: (user) => user.sequenceCount > 0,
  defaultSettings: defaultProfilePageSequencesTabSettings,
  showSettingsButton: true,
  settingsButtonDisabled: true,
};

const commentsTab: ProfilePageTabDefinition<"comments"> = {
  id: "comments",
  label: "Comments",
  isAvailable: (user) => user.commentCount > 0,
  defaultSettings: defaultProfilePageCommentsTabSettings,
  showSettingsButton: true,
};

const wikiEditsTab: ProfilePageTabDefinition<"wikiEdits"> = {
  id: "wikiEdits",
  label: "Wiki edits",
  isAvailable: (user) => user.tagRevisionCount > 0,
  defaultSettings: defaultProfilePageWikiEditsTabSettings,
  showSettingsButton: false,
};

const quickTakesTab: ProfilePageTabDefinition<"quickTakes"> = {
  id: "quickTakes",
  label: "Quick takes",
  isAvailable: (user) => !!user.shortformFeedId,
  defaultSettings: defaultProfilePageQuickTakesTabSettings,
  showSettingsButton: false,
};

const feedTab: ProfilePageTabDefinition<"feed"> = {
  id: "feed",
  label: "All",
  isAvailable: () => true,
  defaultSettings: defaultProfilePageFeedTabSettings,
  showSettingsButton: true,
  useMultiColumnSettingsPanel: true,
};

const allTabs = [
  //feedTab,
  postsTab,
  commentsTab,
  wikiEditsTab,
  sequencesTab,
  quickTakesTab,
] as const;

const profilePageTabSettingsByTabSchema = z.object({
  posts: profilePageAllPostsTabSettingsSchema.catch(defaultProfilePageAllPostsTabSettings).optional().default(defaultProfilePageAllPostsTabSettings),
  comments: profilePageCommentsTabSettingsSchema.catch(defaultProfilePageCommentsTabSettings).optional().default(defaultProfilePageCommentsTabSettings),
  wikiEdits: profilePageWikiEditsTabSettingsSchema.catch(defaultProfilePageWikiEditsTabSettings).optional().default(defaultProfilePageWikiEditsTabSettings),
  sequences: profilePageSequencesTabSettingsSchema.catch(defaultProfilePageSequencesTabSettings).optional().default(defaultProfilePageSequencesTabSettings),
  quickTakes: profilePageQuickTakesTabSettingsSchema.catch(defaultProfilePageQuickTakesTabSettings).optional().default(defaultProfilePageQuickTakesTabSettings),
  feed: profilePageFeedTabSettingsSchema.catch(defaultProfilePageFeedTabSettings).optional().default(defaultProfilePageFeedTabSettings),
});

function parseProfileTabSettingsCookie(value: unknown): ProfilePageTabSettingsByTab {
  if (typeof value !== "string") {
    return {
      posts: defaultProfilePageAllPostsTabSettings,
      comments: defaultProfilePageCommentsTabSettings,
      wikiEdits: defaultProfilePageWikiEditsTabSettings,
      sequences: defaultProfilePageSequencesTabSettings,
      quickTakes: defaultProfilePageQuickTakesTabSettings,
      feed: defaultProfilePageFeedTabSettings,
    };
  }

  try {
    return profilePageTabSettingsByTabSchema.parse(JSON.parse(value));
  } catch {
    return {
      posts: defaultProfilePageAllPostsTabSettings,
      comments: defaultProfilePageCommentsTabSettings,
      wikiEdits: defaultProfilePageWikiEditsTabSettings,
      sequences: defaultProfilePageSequencesTabSettings,
      quickTakes: defaultProfilePageQuickTakesTabSettings,
      feed: defaultProfilePageFeedTabSettings,
    };
  }
}

function getTabById(tabId: ProfileTab) {
  return allTabs.find((tab) => tab.id === tabId) ?? feedTab;
}

function parseProfileTab(value: string): ProfileTab | null {
  if (typeof value !== "string") return null;
  const tab = allTabs.find((tab) => tab.id === value);
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

function toggleSettingsPanel(
  settingsPanelOpen: boolean,
  setSettingsPanelOpen: (open: boolean) => void,
  setSettingsPanelClosing: (closing: boolean) => void,
) {
  if (settingsPanelOpen) {
    setSettingsPanelClosing(true);
    setTimeout(() => {
      setSettingsPanelOpen(false);
      setSettingsPanelClosing(false);
    }, SORT_PANEL_CLOSE_MS);
  } else {
    setSettingsPanelOpen(true);
  }
}

export function ProfilePageTabbedSection({user}: {
  user: UsersProfile
}) {
  const [cookies, setCookie] = useCookiesWithConsent([SELECTED_PROFILE_TAB_COOKIE, PROFILE_TAB_SETTINGS_COOKIE]);
  const availableTabs = allTabs.filter((tab) => tab.isAvailable(user));
  const availableTabIds = availableTabs.map((tab) => tab.id);
  const [activeTab, setActiveTab] = useState<ProfileTab>(getInitialProfileTab({
    preferredTab: parseProfileTab(cookies[SELECTED_PROFILE_TAB_COOKIE]),
    availableTabs: availableTabIds,
  }));
  const [tabSettingsByTab, setTabSettingsByTab] = useState<ProfilePageTabSettingsByTab>(() => (
    parseProfileTabSettingsCookie(cookies[PROFILE_TAB_SETTINGS_COOKIE])
  ));
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [settingsPanelClosing, setSettingsPanelClosing] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const serializedTabSettings = JSON.stringify(tabSettingsByTab);
  const activeTabDefinition = availableTabs.find((tab) => tab.id === activeTab) ?? feedTab;
  const showSettingsButton = activeTabDefinition.showSettingsButton;
  const settingsButtonDisabled = !!activeTabDefinition.settingsButtonDisabled;
  const showSettingsPanel = (settingsPanelOpen || settingsPanelClosing) && showSettingsButton && !settingsButtonDisabled;

  useEffect(() => {
    setCookie(PROFILE_TAB_SETTINGS_COOKIE, serializedTabSettings, { path: "/" });
  }, [serializedTabSettings, setCookie]);

  useEffect(() => {
    if (!availableTabIds.includes(activeTab)) {
      setActiveTab(getInitialProfileTab({
        preferredTab: null,
        availableTabs: availableTabIds,
      }));
    }
  }, [activeTab, availableTabIds]);

  const handleTabSwitch = (tab: ProfileTab) => {
    setCookie(SELECTED_PROFILE_TAB_COOKIE, tab, { path: "/" });
    const nextTab = getTabById(tab);
    if (!nextTab.showSettingsButton || nextTab.settingsButtonDisabled) {
      setSettingsPanelOpen(false);
      setSettingsPanelClosing(false);
    }
    switchTab(tab, tabsRef, setActiveTab);
  };
  const handleSettingsPanelToggle = () => toggleSettingsPanel(settingsPanelOpen, setSettingsPanelOpen, setSettingsPanelClosing);

  const sharedClasses = useStyles(profileStyles);
  const classes = useStyles(profilePageTabbedSectionUnsharedStyles);

  const updateTabSettings = <T extends ProfileTab>(tab: T, settings: ProfilePageTabSettingsByTab[T]) => {
    setTabSettingsByTab((currentSettings) => ({
      ...currentSettings,
      [tab]: settings,
    }));
  };

  const renderActiveTabSettingsForm = () => {
    switch (activeTab) {
    case "posts":
      return <ProfilePageAllPostsTabSettingsForm
        settings={tabSettingsByTab.posts}
        onChange={(settings) => updateTabSettings("posts", settings)}
      />;
    case "comments":
      return <ProfilePageCommentsTabSettingsForm
        settings={tabSettingsByTab.comments}
        onChange={(settings) => updateTabSettings("comments", settings)}
      />;
    case "wikiEdits":
      return <ProfilePageWikiEditsTabSettingsForm
        settings={tabSettingsByTab.wikiEdits}
        onChange={(settings) => updateTabSettings("wikiEdits", settings)}
      />;
    case "sequences":
      return <ProfilePageSequencesTabSettingsForm
        settings={tabSettingsByTab.sequences}
        onChange={(settings) => updateTabSettings("sequences", settings)}
      />;
    case "quickTakes":
      return <ProfilePageQuickTakesTabSettingsForm
        settings={tabSettingsByTab.quickTakes}
        onChange={(settings) => updateTabSettings("quickTakes", settings)}
      />;
    case "feed":
      return <ProfilePageFeedTabSettingsForm
        settings={tabSettingsByTab.feed}
        onChange={(settings) => updateTabSettings("feed", settings)}
      />;
    }
  };

  const renderActiveTabContents = () => {
    switch (activeTab) {
    case "posts":
      return <ProfilePageAllPostsTabContents user={user} settings={tabSettingsByTab.posts} />;
    case "comments":
      return <ProfilePageCommentsTabContents user={user} settings={tabSettingsByTab.comments} />;
    case "wikiEdits":
      return <ProfilePageWikiEditsTabContents user={user} settings={tabSettingsByTab.wikiEdits} />;
    case "sequences":
      return <ProfilePageSequencesTabContents user={user} settings={tabSettingsByTab.sequences} />;
    case "quickTakes":
      return <ProfilePageQuickTakesTabContents user={user} settings={tabSettingsByTab.quickTakes} />;
    case "feed":
      return <ProfilePageFeedTabContents user={user} settings={tabSettingsByTab.feed} />;
    }
  };

  return <div className={classes.allPostsLeftColumn}>
    <div className={classes.allPostsHeader} ref={tabsRef}>
      <div className={classes.allPostsLeftHeader}>
        <div className={classes.profileTabs}>
          {allTabs.map((tab) => availableTabIds.includes(tab.id) && (
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
        {showSettingsButton && (
          <div className={classes.sortControl}>
            <button 
              className={classNames(classes.sortIconButton, settingsButtonDisabled && classes.sortIconDisabled)}
              onClick={!settingsButtonDisabled ? handleSettingsPanelToggle : undefined}
              type="button"
            >
              <span className={classes.sortIcon}>⚙</span>
            </button>
          </div>
        )}
      </div>
    </div>

    {showSettingsPanel && (
      <div className={classNames(
        sharedClasses.sortPanel,
        activeTabDefinition.useMultiColumnSettingsPanel && sharedClasses.sortPanelMulti,
        settingsPanelClosing && sharedClasses.sortPanelClosing,
      )}>
        {renderActiveTabSettingsForm()}
      </div>
    )}

    <Suspense>
      <div className={classes.allPostsContainer}>
        {renderActiveTabContents()}
      </div>
    </Suspense>
  </div>
}
