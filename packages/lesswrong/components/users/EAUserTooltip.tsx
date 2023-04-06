import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";

const styles = (_: ThemeType): JssStyles => ({
});

const EAUserTooltip = ({user, classes}: {
  user: UsersMinimumInfo,
  classes: ClassesType,
}) => {
  return (
    <div>
      {user.displayName}
    </div>
  );
}

const EAUserTooltipComponent = registerComponent(
  "EAUserTooltip",
  EAUserTooltip,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAUserTooltip: typeof EAUserTooltipComponent
  }
}
