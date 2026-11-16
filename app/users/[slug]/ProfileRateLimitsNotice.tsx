"use client";
import React from "react";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import ActiveRateLimitsNotice from "@/components/users/ActiveRateLimitsNotice";

const ProfileActiveRateLimitsQuery = gql(`
  query ProfileActiveRateLimitsQuery($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        _id
        activeCommentRateLimits {
          ...ActiveRateLimitInfo
        }
        activePostRateLimits {
          ...ActiveRateLimitInfo
        }
      }
    }
  }
`);

const styles = defineStyles("ProfileRateLimitsNotice", (theme: ThemeType) => ({
  root: {
    marginTop: 20,
    padding: "10px 12px",
    backgroundColor: theme.palette.background.warningTranslucent,
  },
}));

export function ProfileRateLimitsNotice({userId}: {
  userId: string
}) {
  const classes = useStyles(styles);
  const { data } = useQuery(ProfileActiveRateLimitsQuery, {
    variables: { documentId: userId },
    fetchPolicy: "cache-and-network",
    ssr: false,
  });
  const user = data?.user?.result;

  return <ActiveRateLimitsNotice
    commentRateLimits={user?.activeCommentRateLimits}
    postRateLimits={user?.activePostRateLimits}
    className={classes.root}
  />;
}
