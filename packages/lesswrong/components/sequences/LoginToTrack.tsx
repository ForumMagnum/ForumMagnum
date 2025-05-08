import React, { ReactNode } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { siteNameWithArticleSetting } from "../../lib/instanceSettings";
import startCase from "lodash/startCase";

const LoginToTrackInner = ({className, children = "Log in to save where you left off"}: {
  className?: string,
  children?: ReactNode,
}) => {
  return (
    <Components.LoginPopupButton title={`${startCase(siteNameWithArticleSetting.get())} keeps track of what posts logged in users have read, so you can keep reading wherever you've left off`} className={className}>
      {children}
    </Components.LoginPopupButton>
  );
}

export const LoginToTrack = registerComponent("LoginToTrack", LoginToTrackInner, {})

declare global {
  interface ComponentTypes {
    LoginToTrack: typeof LoginToTrack
  }
}
