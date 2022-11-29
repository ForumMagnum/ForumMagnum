import React from "react";
import { subforumSlugsSetting, useLocation } from "../../lib/routeUtil";
import { Components, registerComponent } from "../../lib/vulcan-lib";

const TagPageRouter = () => {
  const { params: { slug }} = useLocation();
  const isSubforum = subforumSlugsSetting.get().includes(slug);

  const {TagPage, TagSubforumPage2} = Components
  return isSubforum ? <TagSubforumPage2/> : <TagPage/>
}

const TagPageRouterComponent = registerComponent("TagPageRouter", TagPageRouter);

declare global {
  interface ComponentTypes {
    TagPageRouter: typeof TagPageRouterComponent
  }
}
