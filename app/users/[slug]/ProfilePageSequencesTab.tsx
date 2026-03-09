"use client";
import React from "react";
import { useQuery } from "@/lib/crud/useQuery";
import { sequenceGetPageUrl } from "@/lib/collections/sequences/helpers";
import { useStyles } from "@/components/hooks/useStyles";
import { Link } from "@/lib/reactRouterWrapper";
import { defaultSequenceBannerIdSetting } from "@/lib/instanceSettings";
import { profileStyles } from "./profileStyles";
import { cssUrl } from "./userProfilePageUtil";
import { gql } from "@/lib/generated/gql-codegen";

const SEQUENCES_LIMIT = 6;

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

export function ProfilePageSequencesTab({user}: {
  user: UsersProfile
}) {
  const classes = useStyles(profileStyles);
  const userId = user._id;

  const { data: sequencesData, loading: sequencesLoading } = useQuery(ProfileSequencesQuery, {
    skip: !userId,
    variables: {
      selector: userId ? { userProfile: { userId } } : undefined,
      limit: SEQUENCES_LIMIT,
      enableTotal: false,
    },
    fetchPolicy: "cache-and-network",
  });
  const sequences = sequencesData?.sequences?.results ?? [];

  return <div className={classes.sequencesGrid}>
    {sequences.map((sequence) => {
      const imageId = sequence.gridImageId || defaultSequenceBannerIdSetting.get();
      return (
        <article key={sequence._id} className={classes.sequenceCard}>
          <Link
            to={sequenceGetPageUrl(sequence)}
            className={classes.articleLink}
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
}
