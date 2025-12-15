import React from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { HeartReactionIcon } from "@/components/icons/reactions/HeartReactionIcon";
import WrappedSection from "./WrappedSection";
import WrappedHeading from "./WrappedHeading";

const styles = (_theme: ThemeType) => ({
  root: {
    maxWidth: "calc(min(480px, 100%))",
    margin: "60px auto 0",
  },
  textRow: {
    maxWidth: 500,
    textWrap: 'pretty',
    margin: '0 auto',
    fontSize: 18,
  },
});

const WrappedThankYouSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <WrappedSection pageSectionContext="thankYou">
      <div className={classes.root}>
        <WrappedHeading>
          Thank you
        </WrappedHeading>
        <div className={classes.textRow}>
          Thanks for joining us on the EA Forum and helping us think about how
          to improve the world.
        </div>
      </div>
    </WrappedSection>
  );
}

export default registerComponent(
  "WrappedThankYouSection",
  WrappedThankYouSection,
  {styles},
);
