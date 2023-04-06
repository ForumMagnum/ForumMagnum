import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";

const styles = (_: ThemeType): JssStyles => ({
});

const EAUserTooltipContent = ({user, classes}: {
  user: UsersMinimumInfo,
  classes: ClassesType,
}) => {
  return (
    <div>
      {user.displayName}
    </div>
  );
}

const EAUserTooltipContentComponent = registerComponent(
  "EAUserTooltipContent",
  EAUserTooltipContent,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAUserTooltipContent: typeof EAUserTooltipContentComponent
  }
}
