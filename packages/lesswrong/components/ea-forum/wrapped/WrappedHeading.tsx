import React, { ReactNode } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    width: 800,
    maxWidth: "100%",
    fontFamily: theme.palette.wrapped.fontFamily,
    color: theme.palette.text.alwaysWhite,
    fontSize: 40,
    fontWeight: 400,
    lineHeight: "110%",
    textWrap: 'pretty',
    letterSpacing: "-1.6px",
    wordBreak: "break-word",
    marginTop: 0,
    marginBottom: 16,
    "& em": {
      color: theme.palette.wrapped.highlightText,
      fontStyle: "normal",
    },
  },
});

const WrappedHeading = ({children, className, classes}: {
  children: ReactNode,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <h2 className={classNames(classes.root, className)}>
      {children}
    </h2>
  );
}

export default registerComponent(
  "WrappedHeading",
  WrappedHeading,
  {styles},
);
