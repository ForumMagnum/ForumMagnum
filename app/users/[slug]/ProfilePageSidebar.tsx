import React, { useState, Suspense } from "react";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { profileStyles } from "./profileStyles";
import { useCurrentUser } from "@/components/common/withUser";
import { getCollapsedBioHtml } from "./userProfilePageUtil";
import UsersNameWithModal from "@/components/ultraFeed/UsersNameWithModal";
import UserNotifyDropdown from "@/components/notifications/UserNotifyDropdown";
import NewConversationButton from "@/components/messaging/NewConversationButton";
import UserMetaInfo from "@/components/users/UserMetaInfo";
import classNames from "classnames";
import ContentStyles from "@/components/common/ContentStyles";
import { ContentItemBody } from "@/components/contents/ContentItemBody";
import ProfileDiamondSections from "./ProfileDiamondSections";

const profilePageSidebarUnsharedStyles = defineStyles("ProfilePageSidebarUnshared", (theme: ThemeType) => ({
  postsSidebar: {
    flex: "0 0 300px",
    position: "sticky",
    top: 80,
    alignSelf: "start",
    "@media (max-width: 630px)": {
      display: "none",
    },
  },
  sidebarAuthorBlock: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingBottom: 6,
    borderBottom: theme.palette.type === "dark"
      ? theme.palette.greyBorder("1px", 0.28)
      : "1px solid rgba(140,110,70,.14)",
  },
  sidebarAuthorName: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    fontWeight: 400,
    margin: 0,
    color: theme.palette.text.normal,
    lineHeight: 1.1,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    "@media (max-width: 630px)": {
      display: "none",
    },
  },
  sidebarAuthorNameLink: {
    color: "inherit",
    textDecoration: "none",
    "&:hover": {
      opacity: 0.67,
    },
  },
  sidebarBioSection: {
    marginTop: 8,
  },
  sidebarMetaInfo: {
    color: theme.palette.text.dim,
    "& > div": {
      flexWrap: "wrap",
      gap: "4px 0",
    },
    "& > div > div": {
      marginRight: "14px !important",
    },
  },
  sidebarBioMeta: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.palette.text.dim,
    fontWeight: 400,
  },
  sidebarBioWrapper: {
    overflow: "hidden",
    transition: "max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  sidebarBioCollapsed: {
    maxHeight: 400,
  },
  sidebarBioExpanded: {
    maxHeight: 2000,
    transition: "max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  postsSidebarReadMore: {
    marginTop: 5,
  },
}));

export function ProfilePageSidebar({user, bioNoFollow}: {
  user: UsersProfile
  bioNoFollow: boolean
}) {
  const sharedClasses = useStyles(profileStyles);
  const classes = useStyles(profilePageSidebarUnsharedStyles);
  const userId = user._id;
  const currentUser = useCurrentUser();

  const [bioExpanded, setBioExpanded] = useState(false);
  const bioHtml = user?.htmlBio ?? "";
  const hasBio = !!bioHtml;
  const collapsedBioHtml = getCollapsedBioHtml(bioHtml);
  const displayBioHtml = bioExpanded ? bioHtml : collapsedBioHtml;
  const showBioExpand = !!bioHtml && collapsedBioHtml !== bioHtml;

  const isOwnProfile = !!currentUser && user && currentUser._id === user._id;
  const canSubscribeToUser = !isOwnProfile;
  const canMessageUser = !!currentUser && !isOwnProfile;

  return <aside className={classNames(classes.postsSidebar)}>
    <div className={classes.sidebarAuthorBlock}>
      <h4 className={classes.sidebarAuthorName}>
        <UsersNameWithModal
          user={user}
          className={classes.sidebarAuthorNameLink}
          tooltipPlacement="bottom-start"
        />
      </h4>
      <div className={classes.sidebarBioMeta}>
        {canSubscribeToUser && <UserNotifyDropdown
          user={user}
          popperPlacement="bottom-start"
          className={sharedClasses.sidebarSubscribe}
        />}
        {canMessageUser && <NewConversationButton user={user} currentUser={currentUser}>
          <a className={sharedClasses.sidebarMore}>Message</a>
        </NewConversationButton>}
      </div>
    </div>

    <div className={classes.sidebarBioSection}>
      {!hasBio && <div className={classes.sidebarMetaInfo}>
        <UserMetaInfo user={user} hidePostCount hideCommentCount omegaAlignment="inline" />
      </div>}

      {hasBio && <>
        <div className={classNames(classes.sidebarBioWrapper, bioExpanded ? classes.sidebarBioExpanded : classes.sidebarBioCollapsed)}>
          <ContentStyles contentType="post" className={sharedClasses.sidebarAuthorBioContent}>
            <ContentItemBody
              className={sharedClasses.sidebarAuthorBio}
              dangerouslySetInnerHTML={{ __html: displayBioHtml }}
              nofollow={bioNoFollow}
            />
          </ContentStyles>
        </div>
        {showBioExpand && (
          <div className={classNames(sharedClasses.readMore, classes.postsSidebarReadMore)}>
            <a 
              href="#" 
              className={sharedClasses.readMoreLink}
              onClick={(e) => {
                e.preventDefault();
                setBioExpanded(!bioExpanded);
              }}
            >
              {bioExpanded ? "See less" : "See more"}
            </a>
          </div>
        )}
      </>}
    </div>
    <Suspense>
      <ProfileDiamondSections
        key={userId}
        userId={userId}
      />
    </Suspense>
  </aside>
}
