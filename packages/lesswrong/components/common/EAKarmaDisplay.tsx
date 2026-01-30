import React from "react";
import { SoftUpArrowIcon } from "../icons/softUpArrowIcon";
import classNames from "classnames";
import KarmaDisplay from "./KarmaDisplay";
import { defineStyles } from "../hooks/defineStyles";
import { useStyles } from "../hooks/useStyles";

const styles = defineStyles("EAKarmaDisplay", (theme: ThemeType) => ({
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
}), {
  stylePriority: -1,
});

const EAKarmaDisplay = ({post, className}: {
  post: PostsList,
  className?: string,
}) => {
  const classes = useStyles(styles);
  return (
    <div className={classNames(classes.root, className)}>
      <div className={classes.voteArrow}>
        <SoftUpArrowIcon />
      </div>
      <KarmaDisplay document={post} />
    </div>
  );
};

export default EAKarmaDisplay;
