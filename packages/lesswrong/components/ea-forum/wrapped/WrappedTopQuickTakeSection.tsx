import React from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { formatPercentile } from "./wrappedHelpers";
import { useForumWrappedContext } from "./hooks";
import { WrappedSection } from "./WrappedSection";
import { WrappedHeading } from "./WrappedHeading";
import { WrappedComment } from "./WrappedComment";

const styles = (_theme: ThemeType) => ({
  topQuickTake: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: 380,
    margin: "24px auto",
  },
  textRow: {
    maxWidth: 500,
    textWrap: 'pretty',
    margin: '0 auto',
  },
});

/**
 * Section that displays the user's highest-karma quick take (shortform) plus
 * other data on their quick takes
 */
const WrappedTopQuickTakeSectionInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {year, data} = useForumWrappedContext();
  const percentile = formatPercentile(data.shortformPercentile);
  return (
    <WrappedSection pageSectionContext="topQuickTake">
      <WrappedHeading>
        Your highest-karma <em>quick take</em> in {year}
      </WrappedHeading>
      <div className={classes.topQuickTake}>
        <WrappedComment comment={data.topShortform} />
      </div>
      <div className={classes.textRow}>
        You wrote {data.shortformCount} quick{" "}
        take{data.shortformCount === 1 ? "" : "s"} in total this year.
        {percentile < 100 &&
          ` This means you're in the top ${percentile}% of quick take authors.`
        }
      </div>
    </WrappedSection>
  );
}

export const WrappedTopQuickTakeSection = registerComponent(
  "WrappedTopQuickTakeSection",
  WrappedTopQuickTakeSectionInner,
  {styles},
);


