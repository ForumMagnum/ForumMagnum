import React, { ReactNode } from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib/components.tsx";
import { WrappedYear } from "./hooks";
import WrappedSection from "@/components/ea-forum/wrapped/WrappedSection";

const styles = (theme: ThemeType) => ({
  container: {
    margin: "40px auto 0",
    [theme.breakpoints.up("sm")]: {
      width: 600,
    },
  },
  heading: {
    fontSize: 54,
    fontWeight: 700,
    lineHeight: "110%",
    letterSpacing: "-2.7px",
    textAlign: "left",
    marginTop: 0,
    wordBreak: "break-word",
  },
  wrapped: {
    color: theme.palette.wrapped.highlightText,
  },
  children: {
    marginBottom: 40,
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
          <div className={classes.children}>
            {children}
          </div>
        }
      </div>
    </WrappedSection>
  );
}

const WrappedWelcomeMessageComponent = registerComponent(
  "WrappedWelcomeMessage",
  WrappedWelcomeMessage,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedWelcomeMessage: typeof WrappedWelcomeMessageComponent
  }
}

export default WrappedWelcomeMessageComponent;
