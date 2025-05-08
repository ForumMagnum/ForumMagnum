import React, { ComponentType, useMemo } from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { isClient } from "@/lib/executionEnvironment";
import { eaEmojiPalette } from "@/lib/voting/eaEmojiPalette";
import { WrappedReceivedReact, useForumWrappedContext } from "./hooks";
import range from "lodash/range";
import { getTotalReactsReceived } from "./wrappedHelpers";
import { WrappedSection } from "./WrappedSection";
import { WrappedHeading } from "./WrappedHeading";

type ReceivedReact = {
  top: string,
  left: string,
  transform: string,
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
      range(0, next.count).forEach((_) => prev.push({
        top: `${Math.random() * 90}%`, // only go to 90% to avoid overlapping the bottom nav
        left: `${Math.random() * 96}%`, // only go to 96% to prevent causing a horizontal scroll
        transform: `rotate(${(Math.random() * 50) - 25}deg)`,
        Component,
      }));
    }
    return prev;
  }, []);
}

const styles = (theme: ThemeType) => ({
  backgroundReact: {
    position: "absolute",
    zIndex: 1,
    color: theme.palette.primary.main,
  },
  heading: {
    position: "relative",
    zIndex: 2,
  },
  reactsReceivedContents: {
    position: "relative",
  },
  otherReacts: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: 400,
    background: theme.palette.wrapped.panelBackgroundDark,
    borderRadius: theme.borderRadius.default,
    padding: 16,
    margin: "30px auto 0",
  },
  subheading: {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: "140%",
    marginBottom: 24,
  },
  stats: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    width: 94,
  },
  statCount: {
    fontSize: 28,
    lineHeight: 'normal',
    fontWeight: 700,
    letterSpacing: "-0.56px",
  },
  statName: {
    fontSize: 13,
    lineHeight: '18px',
    fontWeight: 500,
  },
});

const WrappedReceivedReactsSectionInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {data} = useForumWrappedContext();
  const {mostReceivedReacts} = data;
  const allReactsReceived = useMemo(
    () => placeBackgroundReacts(mostReceivedReacts),
    [mostReceivedReacts],
  );
  const totalReactsReceived = getTotalReactsReceived(data);
  return (
    <WrappedSection pageSectionContext="reactsReceived" fullHeight>
      {allReactsReceived?.map(({top, left, transform, Component}, i) => (
        <div
          key={i}
          className={classes.backgroundReact}
          style={{top, left, transform}}
        >
          <Component />
        </div>
      ))}
      <WrappedHeading className={classes.heading}>
        Others gave you{" "}
        <em>
          {mostReceivedReacts[0].count} {mostReceivedReacts[0].name}
        </em>{" "}
        reacts{mostReceivedReacts.length > 1 ? "..." : ""}
      </WrappedHeading>
      {mostReceivedReacts.length > 1 && (
        <div className={classes.otherReacts}>
          <div className={classes.subheading}>
            ...and {totalReactsReceived} reacts in total:
          </div>
          <div className={classes.stats}>
            {mostReceivedReacts.slice(1).map(({name, count}) => (
              <article key={name} className={classes.stat}>
                <div className={classes.statCount}>{count}</div>
                <div className={classes.statName}>{name}</div>
              </article>
            ))}
          </div>
        </div>
      )}
    </WrappedSection>
  );
}

export const WrappedReceivedReactsSection = registerComponent(
  "WrappedReceivedReactsSection",
  WrappedReceivedReactsSectionInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedReceivedReactsSection: typeof WrappedReceivedReactsSection
  }
}
