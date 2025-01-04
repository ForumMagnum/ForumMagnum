import React from "react";
import { Components, registerComponent } from "@/lib/vulcan-lib";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useForumWrappedContext } from "./hooks";
import {
  formattedKarmaChangeText,
  wrappedHighlightColor,
  wrappedSecondaryColor,
  wrappedWhiteColor,
} from "./wrappedHelpers";

const styles = (theme: ThemeType) => ({
  chart: {
    position: "relative",
    width: "100%",
    maxWidth: 400,
    margin: "40px auto 0",
  },
  labels: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 300,
    fontSize: 14,
    lineHeight: "normal",
    fontWeight: 500,
    margin: "0 auto 14px",
  },
  fromPostsLabel: {
    color: theme.palette.wrapped.highlightText,
  },
  fromCommentsLabel: {
    color: theme.palette.wrapped.secondaryText,
  },
});

/**
 * Section that displays the user's overall karma change and accompanying chart
 */
const WrappedKarmaChangeSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {data} = useForumWrappedContext();
  const {WrappedSection, WrappedHeading} = Components;
  return (
    <WrappedSection pageSectionContext="karmaChange">
      <WrappedHeading>
        Your overall karma change this year was{" "}
        <em>{formattedKarmaChangeText(data.karmaChange)}</em>
      </WrappedHeading>
      <div className={classes.chart}>
        <div className={classes.labels}>
          <div className={classes.fromPostsLabel}>Karma from posts</div>
          <div className={classes.fromCommentsLabel}>Karma from comments</div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart width={350} height={200} data={data.combinedKarmaVals}>
            <YAxis
              tick={false}
              axisLine={{strokeWidth: 2, stroke: wrappedWhiteColor}}
              width={2}
            />
            <XAxis
              dataKey="date"
              tick={false}
              axisLine={{strokeWidth: 3, stroke: wrappedWhiteColor}}
              height={16}
              label={
                <>
                  <text
                    y="100%"
                    fontSize={12}
                    fill={wrappedWhiteColor}
                    textAnchor="start"
                  >
                    Jan
                  </text>
                  <text
                    x="100%"
                    y="100%"
                    fontSize={12}
                    fill={wrappedWhiteColor}
                    textAnchor="end"
                  >
                    Dec
                  </text>
                </>
              }
            />
            <Area
              dataKey="commentKarma"
              stackId="1"
              stroke={wrappedSecondaryColor}
              fill={wrappedSecondaryColor}
              fillOpacity={1}
            />
            <Area
              dataKey="postKarma"
              stackId="1"
              stroke={wrappedHighlightColor}
              fill={wrappedHighlightColor}
              fillOpacity={1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </WrappedSection>
  );
}

const WrappedKarmaChangeSectionComponent = registerComponent(
  "WrappedKarmaChangeSection",
  WrappedKarmaChangeSection,
  {styles},
);

declare global {
  interface ComponentTypes {
    WrappedKarmaChangeSection: typeof WrappedKarmaChangeSectionComponent
  }
}
