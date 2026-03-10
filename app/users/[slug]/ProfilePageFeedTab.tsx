"use client";
import React from "react";
import classNames from "classnames";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import UserContentFeed from "@/components/users/UserContentFeed";
import { UltraFeedContextProvider } from "@/components/ultraFeed/UltraFeedContextProvider";
import { UltraFeedObserverProvider } from "@/components/ultraFeed/UltraFeedObserver";
import { OverflowNavObserverProvider } from "@/components/ultraFeed/OverflowNavObserverContext";
import { profileStyles } from "./profileStyles";
import { userGetDisplayName } from "@/lib/collections/users/helpers";
import { z } from "zod";

const profilePageFeedTabUnsharedStyles = defineStyles("ProfilePageFeedTabUnshared", () => ({
  tabPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    animation: "$slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    "@media (max-width: 630px)": {
      order: 1,
    },
  },
  feedList: {
    "& .UserContentFeed-feedContent": {
      marginLeft: 0,
      marginRight: 0,
    },
  },
}));

export const profilePageFeedTabSortingModeSchema = z.enum(["recent", "top"]);
export const profilePageFeedTabFilterSchema = z.enum(["all", "posts", "quickTakes", "comments"]);
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
  // FIXME: This is missing some other content types. The there-is-nothing handler should be coming from MixedTypeFeed.
  const hasFeedContent = hasPosts || (user?.commentCount ?? 0) > 0;

  return <div className={classNames(classes.feedList, classes.tabPanel)}>
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
  </div>
}
