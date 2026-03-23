"use client";
import React, { Suspense, useState } from "react";
import { gql } from "@/lib/generated/gql-codegen";
import { useSuspenseQuery } from "@/lib/crud/useQuery";
import { userCanEditUser, userGetDisplayName } from "@/lib/collections/users/helpers";
import { userGetEditUrl } from "@/lib/vulcan-users/helpers";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { getUserFromResults } from "@/components/users/UsersProfile";
import { useCurrentUser } from "@/components/common/withUser";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import UsersNameWithModal from "@/components/ultraFeed/UsersNameWithModal";
import LWTooltip from "@/components/common/LWTooltip";
import EditIcon from "@/lib/vendor/@material-ui/icons/src/Edit";
import VisibilityOutlinedIcon from "@/lib/vendor/@material-ui/icons/src/VisibilityOutlined";
import { Link } from "@/lib/reactRouterWrapper";
import { nofollowKarmaThreshold } from "@/lib/instanceSettings";
import Error404 from "@/components/common/Error404";
import { StatusCodeSetter } from "@/components/next/StatusCodeSetter";
import { UserProfileTopPostsSection } from "./UserProfileTopPostsSection";
import { ProfilePageTabbedSection } from "./ProfilePageTabbedSection";
import { ProfilePageMobileBio, ProfilePageSidebar } from "./ProfilePageSidebar";

const profilePageUnsharedStyles = defineStyles("ProfilePageUnshared", (theme: ThemeType) => ({
  page: {
    width: "100%",
    minHeight: "100vh",
    // Cancel the centralColumn padding-top so the profile page sits flush
    marginTop: -theme.spacing.mainLayoutPaddingTop,
    background: "transparent",
    color: theme.palette.text.normal,
    fontFamily: theme.typography.fontFamily,
    position: "relative" as const,
    overflow: "hidden",
    boxSizing: "border-box" as const,
    "& *": {
      boxSizing: "border-box" as const,
    },
    [theme.breakpoints.down("md")]: {
      marginTop: -theme.spacing.mainLayoutPaddingTop,
    },
    [theme.breakpoints.down("sm")]: {
      marginTop: -10,
    },
  },
  profileContent: {
    display: "block",
    minHeight: "calc(100vh - 60px)",
  },
  profileMain: {
    width: "100%",
    maxWidth: 1100,
    margin: "0 auto",
    padding: "53px 80px 60px 80px",
    color: theme.palette.text.normal,
    background: "transparent",
    "@media (max-width: 900px)": {
      padding: "40px 30px 50px 30px",
    },
    "@media (max-width: 750px)": {
      padding: "35px 25px 45px 25px",
    },
    "@media (max-width: 630px)": {
      padding: "30px 20px 40px 20px",
    },
  },
  profileHeader: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottom: theme.palette.type === "dark"
      ? theme.palette.greyBorder("1px", 0.28)
      : "1px solid rgba(140,110,70,.14)",
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
  },
  profileName: {
    gridColumn: 2,
    textAlign: "center",
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontSize: "2.3rem",
    fontWeight: 400,
    margin: "0 0 2px 0",
    color: theme.palette.text.normal,
    lineHeight: 1.1,
    letterSpacing: "-.02em",
  },
  profileNameLink: {
    color: "inherit",
    fontFamily: "inherit",
    fontSize: "inherit",
    fontWeight: "inherit" as const,
    letterSpacing: "inherit",
    textDecoration: "none",
    "&:hover": {
      textDecoration: "none",
      color: "inherit",
    },
  },
  profileHeaderActions: {
    gridColumn: 3,
    justifySelf: "end",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    position: "relative",
    top: 2,
  },
  profileActionIconLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "light-dark(#000, #fff)",
    textDecoration: "none",
    cursor: "pointer",
    "&:hover": {
      opacity: 0.67,
    },
    "&:focus-visible": {
      outline: "1px solid light-dark(#000, #fff)",
      outlineOffset: 2,
      borderRadius: 2,
    },
  },
  profileActionIcon: {
    fontSize: 16,
  },
  allPostsSection: {
    marginTop: 30,
    display: "flex",
    gap: 25,
    "@media (max-width: 630px)": {
      flexDirection: "column",
    },
  },
}));

const ProfileUserQuery = gql(`
  query ProfileUserQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UsersProfile
      }
      totalCount
    }
  }
`);

export default function ProfilePage({slug}: {
  slug: string
}) {
  const classes = useStyles(profilePageUnsharedStyles);

  const { data: userData } = useSuspenseQuery(ProfileUserQuery, {
    variables: {
      selector: { usersProfile: { slug } },
      limit: 1,
      enableTotal: false,
    },
    fetchPolicy: "cache-and-network",
  });
  const user = getUserFromResults(userData?.users?.results);

  if (!user) {
    return <div className={classes.profileContent}>
      <main className={classes.profileMain}>
        <Error404 />
      </main>
    </div>;
  }

  return <>
    <StatusCodeSetter status={200}/>
    <ProfilePageInner user={user} />
  </>
}

function ProfilePageInner({user}: {
  user: UsersProfile
}) {
  const classes = useStyles(profilePageUnsharedStyles);
  const userId = user?._id;
  const bioNoFollow = user.karma < nofollowKarmaThreshold.get();

  const currentUser = useCurrentUser();

  return (
    <div className={classes.page}>
      <div className={classes.profileContent}>
        <main className={classes.profileMain}>
          <div className={classes.profileHeader}>
            <h1 className={classes.profileName}>
              <UsersNameWithModal
                user={user}
                className={classes.profileNameLink}
                tooltipPlacement="bottom-start"
              />
            </h1>
            <Suspense>
              <ProfileHeaderActions user={user} />
            </Suspense>
          </div>
          {!user.hideProfileTopPosts && <UserProfileTopPostsSection user={user}/>}

          <Suspense>
            <ProfilePageMobileBio user={user} bioNoFollow={bioNoFollow}/>
          </Suspense>

          <section className={classes.allPostsSection}>
            <ProfilePageTabbedSection user={user} />
            <Suspense>
              <ProfilePageSidebar user={user} bioNoFollow={bioNoFollow}/>
            </Suspense>
          </section>
        </main>
      </div>
    </div>
  );
}

function ProfileHeaderActions({user}: {
  user: UsersProfile
}) {
  const classes = useStyles(profilePageUnsharedStyles);
  const currentUser = useCurrentUser();
  const canEditProfile = !!user && userCanEditUser(currentUser, user);
  const canModerateUserProfile = userIsAdminOrMod(currentUser);
  const username = userGetDisplayName(user);

  if (!canEditProfile && !canModerateUserProfile) return null;

  return (
    <div className={classes.profileHeaderActions}>
      {canEditProfile && (
        <LWTooltip title="Edit profile" placement="bottom">
          <Link
            to={userGetEditUrl(user)}
            className={classes.profileActionIconLink}
            aria-label={`Edit ${username}'s profile`}
          >
            <EditIcon className={classes.profileActionIcon} />
          </Link>
        </LWTooltip>
      )}
      {canModerateUserProfile && (
        <LWTooltip title="Supermod page" placement="bottom">
          <Link
            to={`/admin/supermod?user=${user._id}`}
            className={classes.profileActionIconLink}
            aria-label={`${username}'s supermod page`}
          >
            <VisibilityOutlinedIcon className={classes.profileActionIcon} />
          </Link>
        </LWTooltip>
      )}
    </div>
  )
}
