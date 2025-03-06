import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useTracking } from "../../lib/analyticsEvents";
import { useCurrentUser } from "./withUser";
import classNames from "classnames";
import LWTooltip from "@/components/common/LWTooltip";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    fontWeight: 600,
    color: `${theme.palette.grey[600]} !important`,
    "&:hover": {
      color: `${theme.palette.grey[800]} !important`,
      opacity: 1,
    },
  },
});

const IntercomFeedbackButton = ({
  title = "Give feedback",
  eventName,
  className,
  classes,
}: {
  title?: string,
  eventName: string,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const {captureEvent} = useTracking();
  const onClick = useCallback(() => {
    // eslint-disable-next-line babel/new-cap
    window.Intercom("trackEvent", eventName);
    captureEvent(eventName);
  }, [eventName, captureEvent]);
  return (
    <LWTooltip title={
      currentUser?.hideIntercom
        ? "You must enable Intercom in your user settings"
        : ""
    }>
      <a onClick={onClick} className={classNames(classes.root, className)}>
        {title}
      </a>
    </LWTooltip>
  );
}

const IntercomFeedbackButtonComponent = registerComponent(
  "IntercomFeedbackButton",
  IntercomFeedbackButton,
  {styles, stylePriority: -5},
);

declare global {
  interface ComponentTypes {
    IntercomFeedbackButton: typeof IntercomFeedbackButtonComponent
  }
}

export default IntercomFeedbackButtonComponent;
