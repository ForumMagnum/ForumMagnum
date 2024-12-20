import React, { useCallback, useEffect } from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { useTracking } from "@/lib/analyticsEvents";
import { useInitiateConversation } from "@/components/hooks/useInitiateConversation";
import { getTopAuthor, getUserProfileLink } from "./wrappedHelpers";
import { Link } from "@/lib/reactRouterWrapper";
import { useForumWrappedContext } from "./hooks";

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
});

const WrappedThankAuthorSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {year, data, currentUser} = useForumWrappedContext();
  const {captureEvent} = useTracking();

  const {
    topAuthorByEngagementPercentile,
    topAuthorPercentByEngagementPercentile,
  } = getTopAuthor(data);

  const {conversation, initiateConversation} = useInitiateConversation();
  useEffect(() => {
    initiateConversation([topAuthorByEngagementPercentile._id]);
  }, [initiateConversation, topAuthorByEngagementPercentile]);

  const onSuccess = useCallback(() => {
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

  const {
    WrappedSection, WrappedHeading, UsersProfileImage, MessagesNewForm, Loading,
  } = Components;
  return (
    <WrappedSection pageSectionContext="thankAuthor">
      <WrappedHeading className={classes.heading}>
        You’re in the top <em>{topAuthorPercentByEngagementPercentile}%</em>{" "}
        of {displayName}’s readers
      </WrappedHeading>
      <div>
        Want to say thanks?
      </div>
      <div className={classes.messageAuthor}>
        <div className={classes.topAuthorInfo}>
          <div>To:</div>
          <div>
            <UsersProfileImage size={24} user={topAuthorByEngagementPercentile} />
          </div>
          <div className={classes.authorName}>
            <Link to={getUserProfileLink(slug, year)}>
              {displayName}
            </Link>
          </div>
        </div>
        {conversation
          ? (
            <div className={classes.newMessageForm}>
              <MessagesNewForm
                conversationId={conversation._id}
                successEvent={onSuccess}
                submitLabel="Send"
              />
            </div>
          )
          : (
            <Loading />
          )
        }
      </div>
    </WrappedSection>
  );
}

const WrappedThankAuthorSectionComponent = registerComponent(
  "WrappedThankAuthorSection",
  WrappedThankAuthorSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedThankAuthorSection: typeof WrappedThankAuthorSectionComponent
  }
}