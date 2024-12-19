import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { useForumWrappedContext } from "./hooks";

const styles = (_theme: ThemeType) => ({
});

const WrappedPersonalitySection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {data: {personality}} = useForumWrappedContext();
  const {WrappedSection, WrappedHeading} = Components;
  return (
    <WrappedSection pageSectionContext="personality">
      <WrappedHeading>
        Your EA Forum personality is...
      </WrappedHeading>
      <div>
        {personality}
      </div>
    </WrappedSection>
  );
}

const WrappedPersonalitySectionComponent = registerComponent(
  "WrappedPersonalitySection",
  WrappedPersonalitySection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedPersonalitySection: typeof WrappedPersonalitySectionComponent
  }
}
