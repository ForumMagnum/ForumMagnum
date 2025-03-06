import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib/components.tsx";
import { useForumWrappedContext } from "./hooks";
import { HeartReactionIcon } from "@/components/icons/reactions/HeartReactionIcon";
import WrappedSection from "@/components/ea-forum/wrapped/WrappedSection";
import WrappedHeading from "@/components/ea-forum/wrapped/WrappedHeading";

const styles = (_theme: ThemeType) => ({
  root: {
    maxWidth: 480,
    margin: "60px auto 0",
  },
  heartIcon: {
    marginLeft: 6,
    '& svg': {
      width: 32,
      height: 30
    }
  },
  textRow: {
    maxWidth: 400,
    textWrap: 'pretty',
    margin: '0 auto',
  },
});

const WrappedThankYouSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {currentUser} = useForumWrappedContext();
  return (
    <WrappedSection pageSectionContext="thankYou">
      <div className={classes.root}>
        <WrappedHeading>
          Thank you! <span className={classes.heartIcon}><HeartReactionIcon /></span>
        </WrappedHeading>
        <div className={classes.textRow}>
          Thanks for joining us on the EA Forum and helping us think about how to improve the world.
        </div>
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

export default WrappedThankYouSectionComponent;
