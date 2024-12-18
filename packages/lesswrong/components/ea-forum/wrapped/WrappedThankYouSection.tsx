import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { useForumWrappedContext } from "./hooks";
import { lightbulbIcon } from "@/components/icons/lightbulbIcon";

const styles = (_theme: ThemeType) => ({
  root: {
  },
});

const WrappedThankYouSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {year, currentUser} = useForumWrappedContext();
  const {WrappedSection, WrappedHeading, ForumIcon} = Components;
  return (
    <WrappedSection pageSectionContext="thankYou">
      <WrappedHeading>
        Thanks for being part of the EA Forum {currentUser?.displayName}
      </WrappedHeading>
      <div>
        You’re helping the community think about how to do the most good in the
        world
      </div>
      <div>
        {lightbulbIcon}
      </div>
      <div>
        View your {year} summary
        <ForumIcon icon="NarrowArrowDown" />
      </div>
    </WrappedSection>
  );
}

const WrappedThankYouSectionComponent = registerComponent(
  "WrappedThankYouSection",
  WrappedThankYouSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedThankYouSection: typeof WrappedThankYouSectionComponent
  }
}
