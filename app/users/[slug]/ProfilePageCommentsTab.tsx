"use client";
import React from "react";
import classNames from "classnames";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import CommentsNode from "@/components/comments/CommentsNode";
import LoadMore from "@/components/common/LoadMore";
import { gql } from "@/lib/generated/gql-codegen";
import { profileStyles } from "./profileStyles";
import { z } from "zod";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";

const profilePageCommentsTabUnsharedStyles = defineStyles("ProfilePageCommentsTabUnshared", () => ({
  tabPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    animation: "$slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    "@media (max-width: 630px)": {
      order: 1,
    },
  },
  commentsList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    paddingTop: 12,
  },
}));

const ProfilePageCommentsQuery = gql(`
  query ProfilePageCommentsQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);

const INITIAL_COMMENTS_TO_SHOW = 20;

export const profilePageCommentsTabSortOrderSchema = z.enum(["new", "top"]);
export const profilePageCommentsTabSettingsSchema = z.object({
  sortBy: profilePageCommentsTabSortOrderSchema,
});
export type ProfilePageCommentsTabSettings = z.infer<typeof profilePageCommentsTabSettingsSchema>;

export const defaultProfilePageCommentsTabSettings: ProfilePageCommentsTabSettings = {
  sortBy: "new",
};

export function ProfilePageCommentsTabSettingsForm({
  settings,
  onChange,
}: {
  settings: ProfilePageCommentsTabSettings,
  onChange: (settings: ProfilePageCommentsTabSettings) => void,
}) {
  const sharedClasses = useStyles(profileStyles);

  return <div className={sharedClasses.sortPanelSection}>
    <div className={sharedClasses.sortPanelHeader}>Sorted by:</div>
    <button
      className={classNames(sharedClasses.sortPanelOption, settings.sortBy === "new" && sharedClasses.sortPanelOptionSelected)}
      onClick={() => onChange({ sortBy: "new" })}
      type="button"
    >
      New
    </button>
    <button
      className={classNames(sharedClasses.sortPanelOption, settings.sortBy === "top" && sharedClasses.sortPanelOptionSelected)}
      onClick={() => onChange({ sortBy: "top" })}
      type="button"
    >
      Top
    </button>
  </div>;
}

export function ProfilePageCommentsTabContents({user, settings}: {
  user: UsersProfile,
  settings: ProfilePageCommentsTabSettings,
}) {
  const sharedClasses = useStyles(profileStyles);
  const classes = useStyles(profilePageCommentsTabUnsharedStyles);
  const userId = user._id;

  const { data, loading, loadMoreProps } = useQueryWithLoadMore(ProfilePageCommentsQuery, {
    skip: !userId,
    variables: {
      selector: userId ? { profileComments: { userId, sortBy: settings.sortBy, authorIsUnreviewed: null } } : undefined,
      limit: INITIAL_COMMENTS_TO_SHOW,
      enableTotal: true,
    },
    itemsPerPage: INITIAL_COMMENTS_TO_SHOW,
    fetchPolicy: "cache-and-network",
  });

  const comments = data?.comments?.results ?? [];
  const hasComments = user.commentCount > 0;

  return <div className={classNames(classes.commentsList, classes.tabPanel)}>
    {!hasComments && !loading && (
      <div className={sharedClasses.emptyStateContainer}>
        <p className={sharedClasses.emptyStateDescription}>{user.displayName} has not written any comments yet.</p>
      </div>
    )}
    {comments.map((comment) => (
      <CommentsNode
        key={comment._id}
        treeOptions={{
          condensed: false,
          post: comment.post || undefined,
          tag: comment.tag || undefined,
          showPostTitle: true,
          forceNotSingleLine: true,
        }}
        comment={comment}
        startThreadTruncated={true}
        loadChildrenSeparately
        loadDirectReplies
      />
    ))}
    <LoadMore {...loadMoreProps} />
  </div>;
}
