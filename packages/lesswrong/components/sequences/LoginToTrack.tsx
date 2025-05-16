import React, { ReactNode } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { siteNameWithArticleSetting } from "../../lib/instanceSettings";
import startCase from "lodash/startCase";
import LoginPopupButton from "../users/LoginPopupButton";

const LoginToTrack = ({className, children = "Log in to save where you left off"}: {
  className?: string,
  children?: ReactNode,
}) => {
  return (
    <LoginPopupButton title={`${startCase(siteNameWithArticleSetting.get())} keeps track of what posts logged in users have read, so you can keep reading wherever you've left off`} className={className}>
      {children}
    </LoginPopupButton>
  );
}

export default registerComponent("LoginToTrack", LoginToTrack, {});


