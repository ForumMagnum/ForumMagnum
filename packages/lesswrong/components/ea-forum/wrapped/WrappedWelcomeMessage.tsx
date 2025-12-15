import React, { ReactNode } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import type { WrappedYear } from "./hooks";
import WrappedSection from "./WrappedSection";

const styles = (theme: ThemeType) => ({
  container: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    margin: "40px auto 0",
    [theme.breakpoints.up("sm")]: {
      width: 600,
    },
  },
  heading: {
    fontSize: 54,
    fontFamily: theme.palette.wrapped.fontFamily,
    fontWeight: 400,
    lineHeight: "110%",
    letterSpacing: "-1.6px",
    textAlign: "left",
    marginTop: 0,
    wordBreak: "break-word",
    [theme.breakpoints.down("sm")]: {
      flexGrow: 1,
    },
  },
  wrapped: {
    color: theme.palette.wrapped.highlightText,
  },
});

/**
 * This section is factored outside of a `Wrapped...Section` component as we
 * need to render it in two different ways:
 *  1. Normally, in the wrapped app flow, inside ForumWrappedContext
 *  2. When the application is loading and we don't have access to a
 *     ForumWrappedContext
 */
const WrappedWelcomeMessage = ({currentUser, year, children, classes}: {
  currentUser: UsersCurrent,
  year: WrappedYear,
  children?: ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <WrappedSection pageSectionContext="top" align="left">
      <div className={classes.container}>
        <h1 className={classes.heading}>
          Hi {currentUser.displayName}, this is your {year} EA Forum{" "}
          <span className={classes.wrapped}>Wrapped</span>
        </h1>
        {children &&
          <div>
            {children}
          </div>
        }
      </div>
    </WrappedSection>
  );
}

export default registerComponent(
  "WrappedWelcomeMessage",
  WrappedWelcomeMessage,
  {styles},
);
