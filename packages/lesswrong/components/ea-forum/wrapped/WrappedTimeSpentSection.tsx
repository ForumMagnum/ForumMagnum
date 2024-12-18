import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { ResponsiveContainer, YAxis, XAxis, LineChart, Line } from "recharts";
import type { WrappedDataByYear, WrappedYear } from "./hooks";
import { formatPercentile, wrappedHighlightColor, wrappedWhiteColor } from "./wrappedHelpers";

// A sample of data to approximate the real graph
type EngagementDataPoint = {
  hours: number,
  count: number
}

const ENGAGEMENT_CHART_DATA: Record<WrappedYear, EngagementDataPoint[]> = {
  2022: [
    {hours: 0, count: 915},
    {hours: 1, count: 1687},
    {hours: 2, count: 770},
    {hours: 3, count: 467},
    {hours: 4, count: 346},
    {hours: 5, count: 258},
    {hours: 8, count: 142},
    {hours: 10, count: 115},
    {hours: 12, count: 92},
    {hours: 14, count: 72},
    {hours: 18, count: 42},
    {hours: 22, count: 37},
    {hours: 26, count: 34},
    {hours: 35, count: 22},
    {hours: 48, count: 7},
    {hours: 59, count: 6},
    {hours: 70, count: 1},
    {hours: 80, count: 4},
    {hours: 113, count: 1},
    {hours: 445, count: 1},
  ],
  2023: [
    {hours: 0, count: 878},
    {hours: 1, count: 1857},
    {hours: 2, count: 884},
    {hours: 3, count: 522},
    {hours: 4, count: 393},
    {hours: 5, count: 309},
    {hours: 8, count: 197},
    {hours: 10, count: 135},
    {hours: 12, count: 102},
    {hours: 14, count: 97},
    {hours: 18, count: 63},
    {hours: 22, count: 39},
    {hours: 26, count: 20},
    {hours: 35, count: 14},
    {hours: 48, count: 8},
    {hours: 59, count: 6},
    {hours: 70, count: 2},
    {hours: 80, count: 2},
    {hours: 113, count: 1},
    {hours: 525, count: 1},
  ],
  2024: [
    {hours: 0, count: 878},
  ],
};

const styles = (_theme: ThemeType) => ({
  chart: {
    position: "relative",
    width: "100%",
    maxWidth: 400,
    margin: "40px auto 0",
  },
});

const WrappedTimeSpentSection = ({data, year, classes}: {
  data: WrappedDataByYear,
  year: WrappedYear,
  classes: ClassesType<typeof styles>,
}) => {
  const formattedPercentile = formatPercentile(data.engagementPercentile);
  // const markPosition = `calc(${97.5 * engagementHours / 530}% + 8px)`
  const engagementHours = (data.totalSeconds / 3600).toFixed(1);
  const xMax = year === 2022 ? 450 : 530;
  const {WrappedSection, WrappedHeading} = Components;
  return (
    <WrappedSection pageSectionContext="engagementPercentile">
      <WrappedHeading>
        You spent <em>{engagementHours}</em> hours on the EA Forum in {year}
      </WrappedHeading>
      <div>
        That puts you in the top {formattedPercentile}% of Forum users
      </div>
      <div className={classes.chart}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart width={350} height={200} data={ENGAGEMENT_CHART_DATA[year]}>
            <YAxis
              dataKey="count"
              tick={false}
              axisLine={{strokeWidth: 2, stroke: wrappedWhiteColor}}
              width={2}
            />
            <XAxis
              dataKey="hours"
              tick={false}
              axisLine={{strokeWidth: 2, stroke: wrappedWhiteColor}}
              height={2}
              scale="linear"
              type="number"
              domain={[0, xMax]}
            />
            <Line
              dataKey="count"
              dot={false}
              stroke={wrappedHighlightColor}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </WrappedSection>
  );
}

const WrappedTimeSpentSectionComponent = registerComponent(
  "WrappedTimeSpentSection",
  WrappedTimeSpentSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedTimeSpentSection: typeof WrappedTimeSpentSectionComponent
  }
}
