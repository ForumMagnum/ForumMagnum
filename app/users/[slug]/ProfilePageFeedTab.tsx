"use client";
import React from "react";
import classNames from "classnames";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import UserContentFeed from "@/components/users/UserContentFeed";
import { UltraFeedContextProvider } from "@/components/ultraFeed/UltraFeedContextProvider";
import { UltraFeedObserverProvider } from "@/components/ultraFeed/UltraFeedObserver";
import { OverflowNavObserverProvider } from "@/components/ultraFeed/OverflowNavObserverContext";
import { profileStyles, TabPanel } from "./profileStyles";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import * as z from "zod";

const profilePageFeedTabUnsharedStyles = defineStyles("ProfilePageFeedTabUnshared", () => ({
  feedList: {
    "& .UserContentFeed-feedContent": {
      marginLeft: 0,
      marginRight: 0,
    },
  },
}));

export const profilePageFeedTabSortingModeSchema = z.enum(["recent", "top"]);
export const profilePageFeedTabFilterSchema = z.enum(["all", "posts", "quickTakes", "comments", "wikiEdits"]);
export const profilePageFeedTabSettingsSchema = z.object({
  sortBy: profilePageFeedTabSortingModeSchema,
  filter: profilePageFeedTabFilterSchema,
});
export type ProfilePageFeedTabSettings = z.infer<typeof profilePageFeedTabSettingsSchema>;

export const defaultProfilePageFeedTabSettings: ProfilePageFeedTabSettings = {
  sortBy: "recent",
  filter: "all",
};

export function ProfilePageFeedTabSettingsForm({
  settings,
  onChange,
}: {
  settings: ProfilePageFeedTabSettings,
  onChange: (settings: ProfilePageFeedTabSettings) => void,
}) {
  const sharedClasses = useStyles(profileStyles);

  return <>
    <div className={sharedClasses.sortPanelSection}>
      <div className={sharedClasses.sortPanelHeader}>Sorted by:</div>
      <button
        className={classNames(sharedClasses.sortPanelOption, settings.sortBy === "recent" && sharedClasses.sortPanelOptionSelected)}
        onClick={() => onChange({ ...settings, sortBy: "recent" })}
        type="button"
      >
        New
      </button>
      <button
        className={classNames(sharedClasses.sortPanelOption, settings.sortBy === "top" && sharedClasses.sortPanelOptionSelected)}
        onClick={() => onChange({ ...settings, sortBy: "top" })}
        type="button"
      >
        Top
      </button>
    </div>
    <div className={sharedClasses.sortPanelSection}>
      <div className={sharedClasses.sortPanelHeader}>Show:</div>
      <button
        className={classNames(sharedClasses.sortPanelOption, settings.filter === "all" && sharedClasses.sortPanelOptionSelected)}
        onClick={() => onChange({ ...settings, filter: "all" })}
        type="button"
      >
        All
      </button>
      <button
        className={classNames(sharedClasses.sortPanelOption, settings.filter === "comments" && sharedClasses.sortPanelOptionSelected)}
        onClick={() => onChange({ ...settings, filter: "comments" })}
        type="button"
      >
        Comments
      </button>
      <button
        className={classNames(sharedClasses.sortPanelOption, settings.filter === "quickTakes" && sharedClasses.sortPanelOptionSelected)}
        onClick={() => onChange({ ...settings, filter: "quickTakes" })}
        type="button"
      >
        Quick takes
      </button>
      <button
        className={classNames(sharedClasses.sortPanelOption, settings.filter === "posts" && sharedClasses.sortPanelOptionSelected)}
        onClick={() => onChange({ ...settings, filter: "posts" })}
        type="button"
      >
        Posts
      </button>
      <button
        className={classNames(sharedClasses.sortPanelOption, settings.filter === "wikiEdits" && sharedClasses.sortPanelOptionSelected)}
        onClick={() => onChange({ ...settings, filter: "wikiEdits" })}
        type="button"
      >
        Wiki edits
      </button>
    </div>
  </>;
}

export function ProfilePageFeedTabContents({user, settings}: {
  user: UsersProfile,
  settings: ProfilePageFeedTabSettings,
}) {
  const sharedClasses = useStyles(profileStyles);
  const classes = useStyles(profilePageFeedTabUnsharedStyles);

  const hasPosts = user.postCount > 0;
  const hasFeedContent = hasPosts || (user?.commentCount ?? 0) > 0 || (user?.tagRevisionCount ?? 0) > 0;

  return <TabPanel className={classes.feedList}>
    {!hasFeedContent && (
      <div className={sharedClasses.emptyStateContainer}>
        <p className={sharedClasses.emptyStateDescription}>{userGetDisplayName(user)} hasn&apos;t written anything yet.</p>
        <div className={sharedClasses.emptyStateImage}>
          <img src="/profile-placeholder-4.png" alt="" />
        </div>
      </div>
    )}
    {hasFeedContent && (
      <UltraFeedContextProvider openInNewTab={true}>
        <UltraFeedObserverProvider incognitoMode={false}>
          <OverflowNavObserverProvider>
            <div className={sharedClasses.profileFeedTopMargin}>
              <UserContentFeed userId={user._id} externalSortMode={settings.sortBy} externalFilter={settings.filter} />
            </div>
          </OverflowNavObserverProvider>
        </UltraFeedObserverProvider>
      </UltraFeedContextProvider>
    )}
  </TabPanel>
}
