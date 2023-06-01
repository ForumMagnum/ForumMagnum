import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { AnalyticsContext } from "../../lib/analyticsEvents";

const styles = (_theme: ThemeType) => ({
});

const QuickTakesSection = () => {
  const {
    SingleColumnSection, SectionTitle, QuickTakesEntry, QuickTakesList,
  } = Components;
  return (
    <AnalyticsContext pageSectionContext="quickTakesSection">
      <SingleColumnSection>
        <SectionTitle title="Quick takes" />
        <QuickTakesEntry />
        <QuickTakesList />
      </SingleColumnSection>
    </AnalyticsContext>
  );
}

const QuickTakesSectionComponent = registerComponent(
  "QuickTakesSection",
  QuickTakesSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    QuickTakesSection: typeof QuickTakesSectionComponent
  }
}
