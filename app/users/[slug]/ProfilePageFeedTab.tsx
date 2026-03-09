"use client";
import React, { useState } from "react";
import classNames from "classnames";
import { useStyles } from "@/components/hooks/useStyles";
import UserContentFeed from "@/components/users/UserContentFeed";
import { UltraFeedContextProvider } from "@/components/ultraFeed/UltraFeedContextProvider";
import { UltraFeedObserverProvider } from "@/components/ultraFeed/UltraFeedObserver";
import { OverflowNavObserverProvider } from "@/components/ultraFeed/OverflowNavObserverContext";
import { profileStyles } from "./profileStyles";
import { userGetDisplayName } from "@/lib/collections/users/helpers";

export function ProfilePageFeedTab({user, sortPanelOpen, sortPanelClosing}: {
  user: UsersProfile,
  sortPanelOpen: boolean,
  sortPanelClosing: boolean
}) {
  const classes = useStyles(profileStyles);
  const [feedSortBy, setFeedSortBy] = useState<"recent" | "top">("recent");
  const [feedFilter, setFeedFilter] = useState<"all" | "posts" | "quickTakes" | "comments">("all");

  const hasPosts = user.postCount > 0;
  // FIXME: This is missing some other content types. The there-is-nothing handler should be coming from MixedTypeFeed.
  const hasFeedContent = hasPosts || (user?.commentCount ?? 0) > 0;

  return <>
    {(sortPanelOpen || sortPanelClosing) && (
      <div className={classNames(classes.sortPanel, classes.sortPanelMulti, sortPanelClosing && classes.sortPanelClosing)}>
        <div className={classes.sortPanelSection}>
          <div className={classes.sortPanelHeader}>Sorted by:</div>
          <button
            className={classNames(classes.sortPanelOption, feedSortBy === "recent" && classes.sortPanelOptionSelected)}
            onClick={() => setFeedSortBy("recent")}
            type="button"
          >
            New
          </button>
          <button
            className={classNames(classes.sortPanelOption, feedSortBy === "top" && classes.sortPanelOptionSelected)}
            onClick={() => setFeedSortBy("top")}
            type="button"
          >
            Top
          </button>
        </div>
        <div className={classes.sortPanelSection}>
          <div className={classes.sortPanelHeader}>Show:</div>
          <button
            className={classNames(classes.sortPanelOption, feedFilter === "all" && classes.sortPanelOptionSelected)}
            onClick={() => setFeedFilter("all")}
            type="button"
          >
            All
          </button>
          <button
            className={classNames(classes.sortPanelOption, feedFilter === "comments" && classes.sortPanelOptionSelected)}
            onClick={() => setFeedFilter("comments")}
            type="button"
          >
            Comments
          </button>
          <button
            className={classNames(classes.sortPanelOption, feedFilter === "quickTakes" && classes.sortPanelOptionSelected)}
            onClick={() => setFeedFilter("quickTakes")}
            type="button"
          >
            Quick takes
          </button>
          <button
            className={classNames(classes.sortPanelOption, feedFilter === "posts" && classes.sortPanelOptionSelected)}
            onClick={() => setFeedFilter("posts")}
            type="button"
          >
            Posts
          </button>
        </div>
      </div>
    )}
    {!hasFeedContent && (
      <div className={classes.emptyStateContainer}>
        <p className={classes.emptyStateDescription}>{userGetDisplayName(user)} hasn&apos;t written anything yet.</p>
        <div className={classes.emptyStateImage}>
          <img src="/profile-placeholder-4.png" alt="" />
        </div>
      </div>
    )}
    {hasFeedContent && (
      <UltraFeedContextProvider openInNewTab={true}>
        <UltraFeedObserverProvider incognitoMode={false}>
          <OverflowNavObserverProvider>
            <div className={classes.profileFeedTopMargin}>
              <UserContentFeed userId={user._id} externalSortMode={feedSortBy} externalFilter={feedFilter} />
            </div>
          </OverflowNavObserverProvider>
        </UltraFeedObserverProvider>
      </UltraFeedContextProvider>
    )}
  </>
}
