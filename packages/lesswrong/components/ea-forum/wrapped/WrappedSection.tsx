import React, { ReactNode } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { AnalyticsContext } from "@/lib/analyticsEvents";
import { HEADER_HEIGHT, MOBILE_HEADER_HEIGHT } from "@/components/common/Header";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    width: "100%",
    minHeight: "100%",
    paddingTop: HEADER_HEIGHT,
    [theme.breakpoints.down("xs")]: {
      paddingTop: MOBILE_HEADER_HEIGHT,
    },
  },
  container: {
    maxWidth: "100%",
    minHeight: "100%",
    margin: "0 auto",
    overflow: "hidden auto",
  },
  maxWidth: {
    width: 700,
  },
  padding: {
    paddingTop: 40 + theme.spacing.mainLayoutPaddingTop,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 60,
    [theme.breakpoints.down("sm")]: {
      paddingLeft: 20,
      paddingRight: 20,
    },
    [theme.breakpoints.down("xs")]: {
      paddingLeft: 12,
      paddingRight: 12,
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

/**
 * Wrapped component for all wrapped sections. It is _not_ safe to use
 * ForumWrappedContext here as this component is also used when the page is
 * still loading.
 */
const WrappedSection = ({
  pageSectionContext,
  align = "center",
  fullWidth,
  fullHeight,
  noPadding,
  children,
  className,
  classes,
}: {
  pageSectionContext: string,
  align?: "left" | "center",
  fullWidth?: boolean,
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
        align === "left" && classes.left,
        align === "center" && classes.center,
        fullHeight && classes.fullHeight,
      )}>
        <div className={classNames(
          classes.container,
          !fullWidth && classes.maxWidth,
          !noPadding && classes.padding,
        )}>
          {children}
        </div>
      </section>
    </AnalyticsContext>
  );
}

export default registerComponent(
  "WrappedSection",
  WrappedSection,
  {styles},
);


