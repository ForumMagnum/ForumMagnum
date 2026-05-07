"use client";
import React from "react";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { sequenceGetPageUrl } from "@/lib/collections/sequences/helpers";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { Link } from "@/lib/reactRouterWrapper";
import { defaultSequenceBannerIdSetting } from "@/lib/instanceSettings";
import { profileStyles, TabPanel } from "./profileStyles";
import { cssUrl } from "./userProfilePageUtil";
import LoadMore from "@/components/common/LoadMore";
import { gql } from "@/lib/generated/gql-codegen";
import { z } from "zod";

const profilePageSequencesTabUnsharedStyles = defineStyles("ProfilePageSequencesTabUnshared", (theme: ThemeType) => ({
  sequencesList: {
    paddingTop: 20,
  },
  sequencesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 20,
    padding: "8px 0",
    "@media (max-width: 630px)": {
      gridTemplateColumns: "1fr",
      gap: 24,
    },
  },
  sequenceCard: {
    display: "flex",
    flexDirection: "column",
    overflow: "visible",
    position: "relative",
    transition: "opacity 0.15s ease",
  },
  sequenceCardImage: {
    width: "100%",
    aspectRatio: "5 / 2",
    backgroundColor: "light-dark(#fcfbf8, #262626)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    borderRadius: 4,
  },
  sequenceCardContent: {
    padding: "10px 0",
    background: "transparent",
  },
  sequenceCardTitle: {
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontSize: 15,
    fontWeight: 400,
    lineHeight: 1.3,
    letterSpacing: "0.03em",
    fontVariant: "small-caps",
    color: theme.palette.text.normal,
    margin: 0,
    borderTop: "none",
    borderRadius: "0 0 8px 8px",
  },
}));

const SEQUENCES_INITIAL_LIMIT = 8;
const SEQUENCES_LOAD_MORE_COUNT = 16;

const ProfileSequencesQuery = gql(`
  query ProfileSequencesQuery($selector: SequenceSelector, $limit: Int, $enableTotal: Boolean) {
    sequences(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SequenceContinueReadingFragment
      }
      totalCount
    }
  }
`);

export const profilePageSequencesTabSettingsSchema = z.object({});
export type ProfilePageSequencesTabSettings = z.infer<typeof profilePageSequencesTabSettingsSchema>;

export const defaultProfilePageSequencesTabSettings: ProfilePageSequencesTabSettings = {};

export function ProfilePageSequencesTabSettingsForm({
  settings,
  onChange,
}: {
  settings: ProfilePageSequencesTabSettings,
  onChange: (settings: ProfilePageSequencesTabSettings) => void,
}) {
  void settings;
  void onChange;
  return null;
}

export function ProfilePageSequencesTabContents({user, settings}: {
  user: UsersProfile,
  settings: ProfilePageSequencesTabSettings,
}) {
  void settings;
  const sharedClasses = useStyles(profileStyles);
  const classes = useStyles(profilePageSequencesTabUnsharedStyles);
  const userId = user._id;

  const { data: sequencesData, loadMoreProps } = useQueryWithLoadMore(ProfileSequencesQuery, {
    skip: !userId,
    variables: {
      selector: userId ? { userProfile: { userId } } : undefined,
      limit: SEQUENCES_INITIAL_LIMIT,
      enableTotal: true,
    },
    itemsPerPage: SEQUENCES_LOAD_MORE_COUNT,
    fetchPolicy: "cache-and-network",
  });
  const sequences = sequencesData?.sequences?.results ?? [];

  return <TabPanel className={classes.sequencesList}>
    <div className={classes.sequencesGrid}>
      {sequences.map((sequence) => {
        const imageId = sequence.gridImageId || defaultSequenceBannerIdSetting.get();
        return (
          <article key={sequence._id} className={classes.sequenceCard}>
            <Link
              to={sequenceGetPageUrl(sequence)}
              className={sharedClasses.articleLink}
            >
              <div
                className={classes.sequenceCardImage}
                style={{
                  backgroundImage: cssUrl(`https://res.cloudinary.com/lesswrong-2-0/image/upload/c_fill,dpr_2.0,g_custom,h_380,q_auto,w_1200/v1/${imageId}`),
                }}
              />
              <div className={classes.sequenceCardContent}>
                <h3 className={classes.sequenceCardTitle}>{sequence.title}</h3>
              </div>
            </Link>
          </article>
        );
      })}
    </div>
    <LoadMore {...loadMoreProps} />
  </TabPanel>
}
