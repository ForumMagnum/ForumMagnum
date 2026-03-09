"use client";
import React, { Suspense, useState } from "react";
import { gql } from "@/lib/generated/gql-codegen";
import { useSuspenseQuery } from "@/lib/crud/useQuery";
import { userCanEditUser, userGetDisplayName } from "@/lib/collections/users/helpers";
import { userGetEditUrl } from "@/lib/vulcan-users/helpers";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { getUserFromResults } from "@/components/users/UsersProfile";
import { useCurrentUser } from "@/components/common/withUser";
import classNames from "classnames";
import { useStyles } from "@/components/hooks/useStyles";
import UsersNameWithModal from "@/components/ultraFeed/UsersNameWithModal";
import LWTooltip from "@/components/common/LWTooltip";
import UserMetaInfo from "@/components/users/UserMetaInfo";
import UserNotifyDropdown from "@/components/notifications/UserNotifyDropdown";
import NewConversationButton from "@/components/messaging/NewConversationButton";
import ContentStyles from "@/components/common/ContentStyles";
import { ContentItemBody } from "@/components/contents/ContentItemBody";
import EditIcon from "@/lib/vendor/@material-ui/icons/src/Edit";
import VisibilityOutlinedIcon from "@/lib/vendor/@material-ui/icons/src/VisibilityOutlined";
import { Link } from "@/lib/reactRouterWrapper";
import { nofollowKarmaThreshold } from "@/lib/instanceSettings";
import { profileStyles } from "./profileStyles";
import Error404 from "@/components/common/Error404";
import { StatusCodeSetter } from "@/components/next/StatusCodeSetter";
import { UserProfileTopPostsSection } from "./UserProfileTopPostsSection";
import { getCollapsedBioHtml } from "./userProfilePageUtil";
import { ProfilePageTabbedSection } from "./ProfilePageTabbedSection";
import { ProfilePageSidebar } from "./ProfilePageSidebar";

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
  const classes = useStyles(profileStyles);

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
  const classes = useStyles(profileStyles);
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
  const classes = useStyles(profileStyles);
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

function ProfilePageMobileBio({user, bioNoFollow}: {
  user: UsersProfile,
  bioNoFollow: boolean
}) {
  const classes = useStyles(profileStyles);
  const currentUser = useCurrentUser();

  const [bioExpanded, setBioExpanded] = useState(false);
  const bioHtml = user?.htmlBio ?? "";
  const collapsedBioHtml = getCollapsedBioHtml(bioHtml);
  const displayBioHtml = bioExpanded ? bioHtml : collapsedBioHtml;
  const showBioExpand = !!bioHtml && collapsedBioHtml !== bioHtml;

  const isOwnProfile = !!currentUser && user && currentUser._id === user._id;
  const canSubscribeToUser = !isOwnProfile;
  const canMessageUser = !!currentUser && !isOwnProfile;

  if (!bioHtml && !user) return null;

  return <div className={classes.mobileProfileBio}>
    <div className={classes.mobileProfileHeaderRow}>
      <h4 className={classes.mobileProfileName}>{userGetDisplayName(user)}</h4>
      <div className={classes.mobileProfileActions}>
        {canSubscribeToUser ? (
          <UserNotifyDropdown
            user={user}
            popperPlacement="bottom-start"
            className={classes.sidebarSubscribe}
          />
        ) : (
          <span className={classNames(classes.sidebarSubscribe, classes.sidebarActionDisabled)}>Subscribe</span>
        )}
        {canMessageUser ? (
          <NewConversationButton user={user} currentUser={currentUser}>
            <a className={classes.sidebarMore}>Message</a>
          </NewConversationButton>
        ) : (
          <span className={classNames(classes.sidebarMore, classes.sidebarActionDisabled)}>Message</span>
        )}
      </div>
    </div>
    {bioHtml && <ContentStyles contentType="post" className={classes.sidebarAuthorBioContent}>
      <ContentItemBody
        className={classes.sidebarAuthorBio}
        dangerouslySetInnerHTML={{ __html: displayBioHtml }}
        nofollow={bioNoFollow}
      />
    </ContentStyles>}
    {showBioExpand && <div className={classes.readMore}>
      <a
        href="#"
        className={classes.readMoreLink}
        onClick={(e) => {
          e.preventDefault();
          setBioExpanded(!bioExpanded);
        }}
      >
        {bioExpanded ? "See less" : "See more"}
      </a>
    </div>}
    {user && <div className={classes.mobileMetaInfo}>
      <UserMetaInfo user={user} />
    </div>}
  </div>
}
