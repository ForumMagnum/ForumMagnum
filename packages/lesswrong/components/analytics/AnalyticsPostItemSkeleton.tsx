import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "12px 4px 12px 12px",
    border: `1px solid ${theme.palette.grey[200]}`,
    borderRadius: theme.borderRadius.default,
    height: 65,
  },
  placeholder: {
    height: 10,
    background: theme.palette.panelBackground.placeholderGradient,
    backgroundSize: "300% 100%",
    animation: "profile-image-loader 1.8s infinite",
    borderRadius: 3,
  },
  title: {
    width: 268,
    marginBottom: 8,
  },
  info: {
    width: 145,
  },
});

export const AnalyticsPostItemSkeletonInner = ({className, classes}: {
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classNames(classes.root, className)}>
      <div className={classNames(classes.title, classes.placeholder)} />
      <div className={classNames(classes.info, classes.placeholder)} />
    </div>
  );
}

export const AnalyticsPostItemSkeleton = registerComponent(
  "AnalyticsPostItemSkeleton",
  AnalyticsPostItemSkeletonInner,
  {styles, stylePriority: -1},
);


