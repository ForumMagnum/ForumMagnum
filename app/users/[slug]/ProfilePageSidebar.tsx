import React, { useState, Suspense } from "react";
import { useStyles } from "@/components/hooks/useStyles";
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

export function ProfilePageSidebar({user, bioNoFollow}: {
  user: UsersProfile
  bioNoFollow: boolean
}) {
  const classes = useStyles(profileStyles);
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
        <UserMetaInfo user={user} hidePostCount hideCommentCount omegaAlignment="inline" />
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
          <div className={classNames(classes.readMore, classes.postsSidebarReadMore)}>
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
          </div>
        )}
      </>}
    </div>
    <Suspense>
      <ProfileDiamondSections
        key={userId}
        userId={userId}
        classes={classes}
      />
    </Suspense>
  </aside>
}
