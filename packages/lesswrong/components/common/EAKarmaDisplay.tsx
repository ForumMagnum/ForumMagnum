import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { SoftUpArrowIcon } from "../icons/softUpArrowIcon";
import classNames from "classnames";
import { KarmaDisplay } from "./KarmaDisplay";

const styles = (theme: ThemeType) => ({
  root: {
    color: theme.palette.grey[600],
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  voteArrow: {
    color: theme.palette.grey[400],
    margin: "-6px 0 2px 0",
  },
});

const EAKarmaDisplayInner = ({post, className, classes}: {
  post: PostsList,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classNames(classes.root, className)}>
      <div className={classes.voteArrow}>
        <SoftUpArrowIcon />
      </div>
      <KarmaDisplay document={post} />
    </div>
  );
};

export const EAKarmaDisplay = registerComponent(
  "EAKarmaDisplay",
  EAKarmaDisplayInner,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    EAKarmaDisplay: typeof EAKarmaDisplay,
  }
}
