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
import { userGetDisplayName } from "@/lib/collections/users/helpers";

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
  sidebarAuthorBio: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: 1.6,
    color: theme.palette.text.dim55,
    fontWeight: 400,
    margin: 0,
  },
  sidebarAuthorBioContent: {
    // Normalize typography across all rendered block types in bio HTML.
    "& p, & ul, & ol, & li, & blockquote, & pre, & h1, & h2, & h3, & h4, & h5, & h6, & table, & th, & td": {
      fontFamily: theme.typography.fontFamily,
      fontSize: 14,
      lineHeight: 1.6,
      color: theme.palette.text.dim55,
      fontWeight: 400,
    },
    "& p": {
      marginTop: 0,
      marginBottom: 12,
    },
    "& p:last-child": {
      marginBottom: 0,
    },
    "& ul, & ol": {
      marginTop: 0,
      marginBottom: 12,
      paddingLeft: 20,
    },
    "& li": {
      marginBottom: 4,
    },
    "& li:last-child": {
      marginBottom: 0,
    },
  },
  postsSidebarReadMore: {
    marginTop: 5,
  },
  mobileProfileBio: {
    display: "none",
    margin: "0 0 30px",
    padding: "30px 0 30px",
    borderBottom: theme.palette.type === "dark"
      ? theme.palette.greyBorder("1px", 0.28)
      : "1px solid rgba(140,110,70,.14)",
    "@media (max-width: 630px)": {
      display: "block",
    },
  },
  mobileProfileName: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    fontWeight: 400,
    margin: 0,
    color: theme.palette.text.normal,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  mobileProfileHeaderRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  mobileProfileActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: 0,
  },
  mobileMetaInfo: {
    marginTop: 12,
    color: theme.palette.text.dim,
    "& > div": {
      flexWrap: "wrap",
      gap: "4px 0",
    },
    "& > div > div": {
      marginRight: "14px !important",
    },
  },
  sidebarActionDisabled: {
    color: theme.palette.primary.light,
    cursor: "default",
    "&:hover": {
      opacity: 1,
    },
  },
  sidebarSubscribe: {
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.main,
    fontSize: 14,
    cursor: "pointer",
    display: "inline-block",
    fontWeight: 400,
    "&:hover": {
      opacity: 0.67,
    },
  },
  sidebarMore: {
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.main,
    fontSize: 14,
    cursor: "pointer",
    display: "inline-block",
    fontWeight: 400,
    textDecoration: "none",
    "&:hover": {
      opacity: 0.67,
    },
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
          className={classes.sidebarSubscribe}
        />}
        {canMessageUser && <NewConversationButton user={user} currentUser={currentUser}>
          <a className={classes.sidebarMore}>Message</a>
        </NewConversationButton>}
      </div>
    </div>

    <div className={classes.sidebarBioSection}>
      {!hasBio && <div className={classes.sidebarMetaInfo}>
        <UserMetaInfo user={user} hidePostCount hideCommentCount omegaAlignment="inline" voteReceivedCount={user.voteReceivedCount ?? undefined} />
      </div>}

      {hasBio && <>
        <div className={classNames(classes.sidebarBioWrapper, bioExpanded ? classes.sidebarBioExpanded : classes.sidebarBioCollapsed)}>
          <ContentStyles contentType="post" className={classes.sidebarAuthorBioContent}>
            <ContentItemBody
              className={classes.sidebarAuthorBio}
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

export function ProfilePageMobileBio({user, bioNoFollow}: {
  user: UsersProfile,
  bioNoFollow: boolean
}) {
  const sharedClasses = useStyles(profileStyles);
  const classes = useStyles(profilePageSidebarUnsharedStyles);
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
    {showBioExpand && <div className={sharedClasses.readMore}>
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
    </div>}
    {user && <div className={classes.mobileMetaInfo}>
      <UserMetaInfo user={user} voteReceivedCount={user.voteReceivedCount ?? undefined} />
    </div>}
  </div>
}