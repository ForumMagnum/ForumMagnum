import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { useForumWrappedContext } from "./hooks";

const styles = (theme: ThemeType) => ({
  root: {
    fontSize: 54,
    fontWeight: 700,
    lineHeight: "110%",
    letterSpacing: "-2.7px",
  },
  wrapped: {
    color: theme.palette.wrapped.highlightText,
  },
  imgWrapper: {
    marginTop: 60,
    display: "inline-block",
  },
  img: {
    maxWidth: "min(80vw, 400px)",
    maxHeight: "50vh",
  },
  messageWrapper: {
    marginTop: 30,
  },
  messageText: {
    display: "inline-block",
    width: "100%",
    maxWidth: 600,
    fontSize: 16,
    lineHeight: "24px",
    fontWeight: 500,
    margin: "0 auto",
  },
});

const WrappedWelcomeSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {year, currentUser} = useForumWrappedContext();
  const {WrappedSection, CloudinaryImage2} = Components;
  return (
    <WrappedSection pageSectionContext="top">
      <h1 className={classes.root}>
        Hi {currentUser.displayName}, this is your {year}{" "}
        <span className={classes.wrapped}>Wrapped</span>
      </h1>
      <CloudinaryImage2
        publicId="2023_wrapped"
        wrapperClassName={classes.imgWrapper}
        className={classes.img}
      />
    </WrappedSection>
  );
}

const WrappedWelcomeSectionComponent = registerComponent(
  "WrappedWelcomeSection",
  WrappedWelcomeSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedWelcomeSection: typeof WrappedWelcomeSectionComponent
  }
}
