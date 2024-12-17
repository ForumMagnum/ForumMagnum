import React, { ReactNode } from "react";
import { registerComponent } from "@/lib/vulcan-lib";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.text.alwaysWhite,
    fontSize: 40,
    fontWeight: 700,
    lineHeight: "110%",
    letterSpacing: "-1.6px",
    marginTop: 0,
    marginBottom: 16,
    "& em": {
      color: theme.palette.wrapped.highlightText,
      fontStyle: "normal",
    },
  },
});

const WrappedHeading = ({children, classes}: {
  children: ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <h2 className={classes.root}>
      {children}
    </h2>
  );
}

const WrappedHeadingComponent = registerComponent(
  "WrappedHeading",
  WrappedHeading,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedHeading: typeof WrappedHeadingComponent
  }
}
