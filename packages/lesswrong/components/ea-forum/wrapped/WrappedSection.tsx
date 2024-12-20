import React, { ReactNode } from "react";
import { registerComponent } from "@/lib/vulcan-lib";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    width: "100%",
  },
  container: {
    width: 700,
    maxWidth: "100vw",
    minHeight: "100%",
    margin: "0 auto",
  },
  padding: {
    padding: 40,
    [theme.breakpoints.down("sm")]: {
      paddingLeft: 20,
      paddingRight: 20,
    },
  },
  center: {
    alignItems: "center",
  },
  left: {
    alignItems: "flex-start",
  },
  fullHeight: {
    height: "100%",
  },
});

const WrappedSection = ({
  pageSectionContext,
  align = "center",
  fullHeight,
  noPadding,
  children,
  className,
  classes,
}: {
  pageSectionContext: string,
  align?: "left" | "center",
  fullHeight?: boolean,
  noPadding?: boolean,
  children?: ReactNode,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <AnalyticsContext pageSectionContext={pageSectionContext}>
      <section className={classNames(
        classes.root,
        className,
        !noPadding && classes.padding,
        align === "left" && classes.left,
        align === "center" && classes.center,
        fullHeight && classes.fullHeight,
      )}>
        <div className={classes.container}>
          {children}
        </div>
      </section>
    </AnalyticsContext>
  );
}

const WrappedSectionComponent = registerComponent(
  "WrappedSection",
  WrappedSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedSection: typeof WrappedSectionComponent
  }
}
