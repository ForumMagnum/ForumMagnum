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
  children,
  classes,
}: {
  pageSectionContext: string,
  align?: "left" | "center",
  fullHeight?: boolean,
  children?: ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <AnalyticsContext pageSectionContext={pageSectionContext}>
      <section className={classNames(
        classes.root,
        align === "left" && classes.left,
        align === "center" && classes.center,
        fullHeight && classes.fullHeight,
      )}>
        {children}
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
