import React, { ComponentType, useMemo } from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { isClient } from "@/lib/executionEnvironment";
import { eaEmojiPalette } from "@/lib/voting/eaEmojiPalette";
import range from "lodash/range";
import type { WrappedReceivedReact } from "./hooks";
import classNames from "classnames";

type ReceivedReact = {
  top: string,
  left: string,
  Component: ComponentType,
}

// Randomly display all the reacts the user received in the background
const placeBackgroundReacts = (reacts?: WrappedReceivedReact[]) => {
  if (!isClient || !reacts) {
    return [];
  }
  return reacts.reduce((prev: ReceivedReact[], next) => {
    const Component = eaEmojiPalette.find(
      (emoji) => emoji.label === next.name,
    )?.Component;
    if (Component) {
      // Only go to 96% to prevent causing a horizontal scroll
      range(0, next.count).forEach(_ => prev.push({
        top: `${Math.random() * 96}%`,
        left: `${Math.random() * 96}%`,
        Component,
      }));
    }
    return prev;
  }, []);
}

const styles = (theme: ThemeType) => ({
  heading: {
    position: "relative",
    zIndex: 2,
  },
  backgroundReact: {
    position: "absolute",
    zIndex: 1,
    color: theme.palette.primary.main,
  },
  reactsReceivedContents: {
    position: "relative",
  },
  otherReacts: {
    width: "100%",
    maxWidth: 400,
    background: theme.palette.wrapped.panelBackgroundDark,
    borderRadius: theme.borderRadius.default,
    padding: "16px",
    margin: "30px auto 0",
  },

  stats: {},
  stat: {},
  statLabel: {},
  mt26: {},
  heading3: {},
  heading5: {},
});

const WrappedReceivedReactsSection = ({receivedReacts, classes}: {
  receivedReacts: WrappedReceivedReact[],
  classes: ClassesType<typeof styles>,
}) => {
  const allReactsReceived = useMemo(
    () => placeBackgroundReacts(receivedReacts),
    [receivedReacts],
  );

  const totalReactsReceived = receivedReacts.reduce(
    (prev, next) => prev + next.count,
    0,
  );
  if (totalReactsReceived <= 5) {
    return null;
  }

  const {WrappedSection, WrappedHeading} = Components;
  return (
    <WrappedSection pageSectionContext="reactsReceived">
      {allReactsReceived?.map(({top, left, Component}, i) => (
        <div key={i} className={classes.backgroundReact} style={{top, left}}>
          <Component />
        </div>
      ))}
      <WrappedHeading className={classes.heading}>
        Others gave you{" "}
        <em>
          {receivedReacts[0].count} {receivedReacts[0].name}
        </em>{" "}
        reacts{receivedReacts.length > 1 ? "..." : ""}
      </WrappedHeading>
      {receivedReacts.length > 1 && (
        <div className={classes.otherReacts}>
          <p className={classes.heading5}>... and {totalReactsReceived} reacts in total:</p>
          <div className={classNames(classes.stats, classes.mt26)}>
            {receivedReacts.slice(1).map(react => {
              return <article key={react.name} className={classes.stat}>
                <div className={classes.heading3}>{react.count}</div>
                <div className={classes.statLabel}>{react.name}</div>
              </article>
            })}
          </div>
        </div>
      )}
    </WrappedSection>
  );
}

const WrappedReceivedReactsSectionComponent = registerComponent(
  "WrappedReceivedReactsSection",
  WrappedReceivedReactsSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedReceivedReactsSection: typeof WrappedReceivedReactsSectionComponent
  }
}
