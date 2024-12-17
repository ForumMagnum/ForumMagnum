import React, { ReactNode } from "react";
import { registerComponent } from "@/lib/vulcan-lib";
import { AnalyticsContext } from "@/lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  "@keyframes section-scroll-animation": {
    "0%": {
      opacity: 0,
    },
    "50%": {
      opacity: 1,
    },
    "100%": {
      opacity: 0,
    }
  },
  root: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "55vh",
    padding: "75px 40px",
    // Fade sections in and out if possible (i.e. on Chrome)
    "@supports (animation-timeline: view())": {
      animation: "section-scroll-animation linear",
      animationTimeline: "view()",
    },
    // If not, then make them taller so that they don't distract from the
    // focused section
    "@supports not (animation-timeline: view())": {
      minHeight: "80vh",
    },
    "&:first-of-type": {
      minHeight: "85vh",
      paddingTop: 140,
    },
    "&:last-of-type": {
      minHeight: "85vh",
      paddingBottom: 200,
    },
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
