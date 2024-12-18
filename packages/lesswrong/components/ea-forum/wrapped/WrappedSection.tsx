import React, { ReactNode } from "react";
import { registerComponent } from "@/lib/vulcan-lib";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "75px 40px",
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
});

const WrappedSection = ({pageSectionContext, align = "center", children, classes}: {
  pageSectionContext: string,
  align?: "left" | "center",
  children?: ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <AnalyticsContext pageSectionContext={pageSectionContext}>
      <section className={classNames(
        classes.root,
        align === "left" && classes.left,
        align === "center" && classes.center,
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
