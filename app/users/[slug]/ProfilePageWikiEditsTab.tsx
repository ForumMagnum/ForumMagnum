"use client";
import React from "react";
import classNames from "classnames";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import SingleLineTagUpdates from "@/components/tagging/SingleLineTagUpdates";
import LoadMore from "@/components/common/LoadMore";
import { maybeDate } from "@/lib/utils/dateUtils";
import { gql } from "@/lib/generated/gql-codegen";
import { profileStyles, TabPanel } from "./profileStyles";
import { z } from "zod";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";

const profilePageWikiEditsTabUnsharedStyles = defineStyles("ProfilePageWikiEditsTabUnshared", () => ({
  wikiEditsList: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    paddingTop: 12,
  },
}));

const ProfilePageWikiEditsQuery = gql(`
  query ProfilePageWikiEditsQuery($selector: RevisionSelector, $limit: Int, $enableTotal: Boolean) {
    revisions(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...RevisionTagFragment
      }
      totalCount
    }
  }
`);

const INITIAL_WIKI_EDITS_TO_SHOW = 10;

export const profilePageWikiEditsTabSettingsSchema = z.object({});
export type ProfilePageWikiEditsTabSettings = z.infer<typeof profilePageWikiEditsTabSettingsSchema>;

export const defaultProfilePageWikiEditsTabSettings: ProfilePageWikiEditsTabSettings = {};

export function ProfilePageWikiEditsTabSettingsForm({
  settings,
  onChange,
}: {
  settings: ProfilePageWikiEditsTabSettings,
  onChange: (settings: ProfilePageWikiEditsTabSettings) => void,
}) {
  void settings;
  void onChange;
  return null;
}

export function ProfilePageWikiEditsTabContents({user, settings}: {
  user: UsersProfile,
  settings: ProfilePageWikiEditsTabSettings,
}) {
  void settings;
  const sharedClasses = useStyles(profileStyles);
  const classes = useStyles(profilePageWikiEditsTabUnsharedStyles);

  const { data, loading, loadMoreProps } = useQueryWithLoadMore(ProfilePageWikiEditsQuery, {
    skip: !user._id,
    variables: {
      selector: { revisionsByUser: { userId: user._id } },
      limit: INITIAL_WIKI_EDITS_TO_SHOW,
      enableTotal: false,
    },
    itemsPerPage: INITIAL_WIKI_EDITS_TO_SHOW,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const results = data?.revisions?.results ?? [];
  const resultsWithLiveTags = results.filter((tagUpdates) => {
    const hasLiveTag = tagUpdates.tag && !tagUpdates.tag.deleted;
    const hasLiveLensTag = tagUpdates.lens?.parentTag && !tagUpdates.lens.parentTag.deleted;
    return hasLiveTag || hasLiveLensTag;
  });

  return <TabPanel className={classes.wikiEditsList}>
    {!loading && resultsWithLiveTags.length === 0 && (
      <div className={sharedClasses.emptyStateContainer}>
        <p className={sharedClasses.emptyStateDescription}>No wikitag contributions to display.</p>
      </div>
    )}
    {resultsWithLiveTags.map((tagUpdates) => {
      const topLevelTag = tagUpdates.tag ?? tagUpdates.lens?.parentTag;
      return <SingleLineTagUpdates
        key={`${tagUpdates.documentId} ${tagUpdates.editedAt}`}
        tag={topLevelTag!}
        revisionIds={[tagUpdates._id]}
        changeMetrics={{ added: tagUpdates.changeMetrics.added, removed: tagUpdates.changeMetrics.removed }}
        lastRevisedAt={maybeDate(tagUpdates.editedAt)}
      />;
    })}
    <LoadMore {...loadMoreProps} />
  </TabPanel>;
}
