import React, { ReactNode } from "react";
import { registerComponent } from "@/lib/vulcan-lib";
import { AnalyticsContext } from "@/lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "75px 40px",
    [theme.breakpoints.down("sm")]: {
      paddingLeft: 20,
      paddingRight: 20,
    },
  },
});

const WrappedSection = ({pageSectionContext, children, classes}: {
  pageSectionContext: string,
  children?: ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <AnalyticsContext pageSectionContext={pageSectionContext}>
      <section className={classes.root}>
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
