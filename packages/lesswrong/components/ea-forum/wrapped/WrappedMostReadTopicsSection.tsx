import React from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useForumWrappedContext } from "./hooks";
import WrappedSection from "./WrappedSection";
import WrappedHeading from "./WrappedHeading";
import { useThemeColor } from "@/components/themes/useTheme";

const styles = (_theme: ThemeType) => ({
  chart: {
    position: "relative",
    width: "100%",
    maxWidth: 400,
    padding: "0 24px", // Extra padding because the chart labels can overflow
    margin: "40px auto 0",
  },
});

/**
 * Section that displays a list of the user's most-read topics
 */
const WrappedMostReadTopicsSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {data: {mostReadTopics}} = useForumWrappedContext();
  const wrappedWhiteColor = useThemeColor(theme => theme.palette.text.alwaysWhite);
  const wrappedHighlightColor = useThemeColor(theme => theme.palette.wrapped.highlightText);

  // The top bar is highlighted, the rest are white
  const topics = mostReadTopics.map((topic, i) => {
    return {
      ...topic,
      fill: i === 0 ? wrappedHighlightColor : "#fff",
    }
  });
  return (
    <WrappedSection pageSectionContext="mostReadTopics">
      <WrappedHeading>
        You spent the most time on <em>{topics[0].name}</em>
      </WrappedHeading>
      <div className={classes.chart}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            layout="vertical"
            width={350}
            height={200}
            data={topics}
            barCategoryGap="20%"
            // @ts-expect-error The library types are missing this, but it does exist
            overflow="visible"
          >
            <YAxis
              dataKey="shortName"
              type="category"
              tickLine={false}
              axisLine={false}
              width={80}
              tick={{fill: wrappedWhiteColor}}
              tickMargin={10}
            />
            <XAxis dataKey="count" type="number" hide />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WrappedSection>
  );
}

export default registerComponent(
  "WrappedMostReadTopicsSection",
  WrappedMostReadTopicsSection,
  {styles},
);


