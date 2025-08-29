import React from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { drawnArrow } from "@/components/icons/drawnArrow";
import { useForumWrappedContext } from "./hooks";
import WrappedSection from "./WrappedSection";
import WrappedHeading from "./WrappedHeading";
import { useThemeColor } from "@/components/themes/useTheme";

const styles = (theme: ThemeType) => ({
  chart: {
    position: "relative",
    width: "100%",
    maxWidth: 400,
    padding: "0 24px", // Extra padding because the chart labels can overflow
    margin: "40px auto 0",
  },
  markYou: {
    position: "absolute",
    left: 130,
    top: -29,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    color: theme.palette.wrapped.highlightText,
  },
  markAvg: {
    position: "absolute",
    left: 147,
    top: 35,
    display: "flex",
    alignItems: "flex-end",
    gap: "4px",
    color: theme.palette.text.alwaysWhite,
  },
  arrowAvg: {
    width: 22,
    transform: "rotate(98deg)",
  },
});

/**
 * Section that displays a list of the core topics that the user has read more 
 * relative to the avg
 */
const WrappedRelativeMostReadTopicsSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {data: {relativeMostReadCoreTopics}} = useForumWrappedContext();
  const wrappedWhiteColor = useThemeColor(theme => theme.palette.text.alwaysWhite);
  const wrappedHighlightColor = useThemeColor(theme => theme.palette.wrapped.highlightText);

  const relativeMostReadTopics = relativeMostReadCoreTopics.map(topic => {
    return {
      ...topic,
      tagName: topic.tagShortName ?? topic.tagName,
      overallReadCount: topic.userReadCount / topic.readLikelihoodRatio,
    }
  }).slice(0, 4);

  const relativeTopicsChartHeight = 200 * (relativeMostReadTopics.length / 4);
  return (
    <WrappedSection pageSectionContext="relativeMostReadTopics">
      <WrappedHeading>
        You read more <em>{relativeMostReadTopics[0].tagName}</em>{" "}
        posts than average
      </WrappedHeading>
      <div className={classes.chart}>
        <aside className={classes.markYou}>
          you
          {drawnArrow}
        </aside>
        <aside className={classes.markAvg}>
          <div className={classes.arrowAvg}>
            {drawnArrow}
          </div>
          average
        </aside>
        <ResponsiveContainer width="100%" height={relativeTopicsChartHeight}>
          <BarChart
            layout="vertical"
            width={350}
            height={relativeTopicsChartHeight}
            data={relativeMostReadTopics}
            barCategoryGap="20%"
            barGap={0}
            // @ts-expect-error The library types are missing this, but it does exist
            overflow="visible"
          >
            <YAxis
              dataKey="tagName"
              type="category"
              tickLine={false}
              axisLine={false}
              width={80}
              tick={{fill: wrappedWhiteColor}}
              tickMargin={10}
            />
            <XAxis dataKey="userReadCount" type="number" hide />
            <Bar dataKey="userReadCount" fill={wrappedHighlightColor} />
            <Bar dataKey="overallReadCount" fill={wrappedWhiteColor} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WrappedSection>
  );
}

export default registerComponent(
  "WrappedRelativeMostReadTopicsSection",
  WrappedRelativeMostReadTopicsSection,
  {styles},
);


