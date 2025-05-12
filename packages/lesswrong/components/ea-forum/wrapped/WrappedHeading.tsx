import React, { ReactNode } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.alwaysWhite,
    fontSize: 40,
    fontWeight: 700,
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


