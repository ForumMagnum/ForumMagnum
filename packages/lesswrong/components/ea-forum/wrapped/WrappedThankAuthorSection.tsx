import React, { useCallback, useEffect, useState } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { useTracking } from "@/lib/analyticsEvents";
import { useInitiateConversation } from "@/components/hooks/useInitiateConversation";
import { getTopAuthor, getUserProfileLink } from "./wrappedHelpers";
import { Link } from "@/lib/reactRouterWrapper";
import { useForumWrappedContext } from "./hooks";
import { WrappedSection } from "./WrappedSection";
import { WrappedHeading } from "./WrappedHeading";
import { UsersProfileImage } from "../../users/UsersProfileImage";
import { MessagesNewForm } from "../../messaging/MessagesNewForm";
import { Loading } from "../../vulcan-core/Loading";
import { ForumIcon } from "../../common/ForumIcon";

const styles = (theme: ThemeType) => ({
  heading: {
    marginBottom: 40,
  },
  messageAuthor: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    width: "100%",
    maxWidth: 500,
    textAlign: "left",
    margin: "50px auto 0",
  },
  topAuthorInfo: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: 14,
    lineHeight: "normal",
    fontWeight: 500,
    color: theme.palette.wrapped.tertiaryText,
  },
  authorName: {
    color: theme.palette.text.alwaysWhite,
  },
  newMessageForm: {
    background: theme.palette.wrapped.panelBackground,
    borderRadius: theme.borderRadius.default,
    padding: "0 16px 16px",
    "& .ck-placeholder": {
      "--ck-color-engine-placeholder-text": theme.palette.wrapped.tertiaryText,
    },
    "& .ContentStyles-commentBody": {
      color: theme.palette.text.alwaysWhite,
    },
    "& .EditorTypeSelect-select": {
      display: "none",
    },
    "& .input-noEmail": {
      display: "none",
    },
    "& .form-submit": {
      display: "flex",
      justifyContent: "flex-end",
    },
    "& button": {
      background: theme.palette.text.alwaysWhite,
      color: theme.palette.wrapped.black,
      "&:hover": {
        background: `color-mix(in oklab, ${theme.palette.text.alwaysWhite} 90%, ${theme.palette.text.alwaysBlack})`,
        color: theme.palette.wrapped.black,
      },
    },
  },
  success: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: '6px',
    fontSize: '18px',
    padding: '20px 0',
  }
});

const WrappedThankAuthorSectionInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {year, data, currentUser} = useForumWrappedContext();
  const {captureEvent} = useTracking();
  const [messageSent, setMessageSent] = useState(false);

  const {
    topAuthorByEngagementPercentile,
    topAuthorPercentByEngagementPercentile,
  } = getTopAuthor(data);

  const {conversation, initiateConversation} = useInitiateConversation();
  useEffect(() => {
    initiateConversation([topAuthorByEngagementPercentile._id]);
  }, [initiateConversation, topAuthorByEngagementPercentile]);

  const onSuccess = useCallback(() => {
    setMessageSent(true)
    if (conversation && currentUser) {
      captureEvent("messageSent", {
        conversationId: conversation._id,
        sender: currentUser._id,
        participantIds: conversation.participantIds,
        messageCount: (conversation.messageCount || 0) + 1,
        from: `${year}_wrapped_thank_author`,
      });
    }
  }, [captureEvent, conversation, currentUser, year]);

  const {displayName, slug} = topAuthorByEngagementPercentile;
  const messageNode = conversation ? (
    <div className={classes.newMessageForm}>
      <MessagesNewForm
        conversationId={conversation._id}
        successEvent={onSuccess}
        submitLabel="Send"
      />
    </div>
  ) : (
    <Loading />
  )
  
  return (
    <WrappedSection pageSectionContext="thankAuthor">
      <WrappedHeading className={classes.heading}>
        You’re in the top <em>{topAuthorPercentByEngagementPercentile}%</em>{" "}
        of {displayName}’s readers
      </WrappedHeading>
      <div>
        Want to say thanks? Send a DM below
      </div>
      <div className={classes.messageAuthor}>
        <div className={classes.topAuthorInfo}>
          <div>To:</div>
          <div>
            <UsersProfileImage size={24} user={topAuthorByEngagementPercentile} />
          </div>
          <div className={classes.authorName}>
            <Link to={getUserProfileLink(slug, year)} target="_blank">
              {displayName}
            </Link>
          </div>
        </div>
        {messageSent ? (
          <div className={classes.success}><ForumIcon icon="CheckCircle" />Sent</div>
        ) : messageNode}
      </div>
    </WrappedSection>
  );
}

export const WrappedThankAuthorSection = registerComponent(
  "WrappedThankAuthorSection",
  WrappedThankAuthorSectionInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedThankAuthorSection: typeof WrappedThankAuthorSection
  }
}
