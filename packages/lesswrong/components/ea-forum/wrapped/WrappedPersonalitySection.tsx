import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";

const styles = (_theme: ThemeType) => ({
});

const WrappedPersonalitySection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {WrappedSection, WrappedHeading} = Components;
  return (
    <WrappedSection pageSectionContext="personality">
      <WrappedHeading>
        Your EA Forum personality is...
      </WrappedHeading>
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
