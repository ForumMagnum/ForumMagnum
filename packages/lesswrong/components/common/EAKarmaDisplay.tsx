import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { SoftUpArrowIcon } from "../icons/softUpArrowIcon";
import classNames from "classnames";

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

const EAKarmaDisplay = ({post, className, classes}: {
  post: PostsList,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {KarmaDisplay} = Components;
  return (
    <div className={classNames(classes.root, className)}>
      <div className={classes.voteArrow}>
        <SoftUpArrowIcon />
      </div>
      <KarmaDisplay document={post} />
    </div>
  );
};

const EAKarmaDisplayComponent = registerComponent(
  "EAKarmaDisplay",
  EAKarmaDisplay,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    EAKarmaDisplay: typeof EAKarmaDisplayComponent,
  }
}
