"use client";

import React, { useState } from "react";
import classNames from "classnames";
import { defineStyles, useStyles } from "../../hooks/useStyles";

/**
 * Hand-rolled two-tone bar chart, ported from the ai-2030 analytics
 * dashboard's DailyBarChart: each day is a flex column whose full bar is the
 * `secondary` series (light tint) with the `primary` series layered inside it
 * (solid accent). A minimal y-axis (rotated title, round-number ticks, faint
 * gridlines) gives the bars a readable scale. Heights and tick positions are
 * computed from the data, so they stay inline styles.
 */

const styles = defineStyles("UsageDailyBarChart", (theme: ThemeType) => ({
  root: {
    display: "flex",
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  axisTitle: {
    display: "flex",
    height: 256,
    width: 16,
    transform: "rotate(180deg)",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    letterSpacing: "0.05em",
    color: theme.palette.grey[500],
    writingMode: "vertical-rl",
  },
  tickGutter: {
    position: "relative",
    height: 256,
    width: 32,
    fontSize: 10,
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
    color: theme.palette.grey[500],
  },
  tickValue: {
    position: "absolute",
    right: 6,
    transform: "translateY(50%)",
  },
  chartColumn: {
    minWidth: 0,
    flex: 1,
  },
  plotArea: {
    position: "relative",
    display: "flex",
    height: 256,
    alignItems: "flex-end",
    gap: 1,
    borderBottom: theme.palette.border.slightlyIntense,
    borderLeft: theme.palette.border.slightlyIntense,
  },
  gridline: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTop: theme.palette.border.faint,
  },
  dayColumn: {
    position: "relative",
    height: "100%",
    minWidth: 0,
    flex: 1,
    cursor: "default",
    "&:hover $dayHighlight": {
      background: `${theme.palette.primary.main}0d`,
    },
  },
  dayHighlight: {
    position: "absolute",
    inset: 0,
  },
  secondaryBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    background: `${theme.palette.primary.main}40`,
  },
  primaryBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.palette.primary.main,
  },
  tooltip: {
    pointerEvents: "none",
    position: "absolute",
    bottom: "100%",
    zIndex: 10,
    marginBottom: 6,
    width: "max-content",
    maxWidth: 180,
    whiteSpace: "normal",
    border: theme.palette.border.normal,
    background: theme.palette.background.paper,
    padding: "6px 8px",
    textAlign: "left",
    fontSize: 11,
    lineHeight: 1.375,
    color: theme.palette.text.normal,
    boxShadow: theme.palette.boxShadow.graphTooltip,
  },
  tooltipLeft: {
    left: 0,
  },
  tooltipRight: {
    right: 0,
  },
  tooltipTitle: {
    fontWeight: 600,
  },
  tooltipRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    fontVariantNumeric: "tabular-nums",
  },
  tooltipRowFirst: {
    marginTop: 2,
  },
  tooltipShare: {
    marginTop: 2,
    borderTop: theme.palette.border.faint,
    paddingTop: 2,
    fontSize: 10,
    color: theme.palette.grey[600],
  },
  legendSwatchLabel: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  swatch: {
    display: "inline-block",
    height: 8,
    width: 8,
  },
  swatchSecondary: {
    background: `${theme.palette.primary.main}40`,
  },
  swatchPrimary: {
    background: theme.palette.primary.main,
  },
  footer: {
    marginTop: 4,
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    fontSize: 11,
    color: theme.palette.grey[600],
  },
  footerLegend: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  footerShare: {
    color: theme.palette.primary.dark,
  },
}));

export interface UsageDailyBarPoint {
  date: string;
  /** The solid accent bar, layered inside the secondary bar. */
  primary: number;
  /** The full-height light-tint bar. */
  secondary: number;
}

const formatDay = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/** primary / secondary as a percentage, guarding the divide-by-zero on empty days. */
const primaryShare = (secondary: number, primary: number) =>
  secondary > 0 ? (primary / secondary) * 100 : 0;

/** "Nice" round y-axis ticks: the smallest 1/2/5×10^k step that yields at most
 * four gridlines, then every multiple of it up to the data max. Counts are
 * integers, so the step never drops below 1. */
const yAxisTicks = (max: number) => {
  const rough = max / 4;
  const pow = 10 ** Math.max(0, Math.floor(Math.log10(rough)));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? (10 * pow);
  const ticks: number[] = [];
  for (let tick = step; tick <= max; tick += step) ticks.push(tick);
  return ticks;
};

/** Compact tick labels ("500", "1.5k") so the axis stays quiet. Tick values
 * are 1/2/5×10^k multiples, so the k-division never produces long decimals. */
const formatTick = (value: number) =>
  value >= 1000 ? `${value / 1000}k` : `${value}`;

const UsageDailyBarChart = ({
  data,
  primaryLabel,
  secondaryLabel,
  /** When set, the tooltip and footer add a "% <shareLabel>" line showing
   * primary as a share of secondary (e.g. "62% unique"). */
  shareLabel,
}: {
  data: UsageDailyBarPoint[];
  primaryLabel: string;
  secondaryLabel: string;
  shareLabel?: string;
}) => {
  const classes = useStyles(styles);
  // Index of the bar the pointer is over, driving a styled tooltip.
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((point) => point.secondary));
  const totalSecondary = data.reduce((sum, point) => sum + point.secondary, 0);
  const totalPrimary = data.reduce((sum, point) => sum + point.primary, 0);
  const overallShare = primaryShare(totalSecondary, totalPrimary);

  const ticks = yAxisTicks(max);

  return (
    <div className={classes.root}>
      {/* Rotated axis title, reading bottom-to-top like the axis it labels. */}
      <span className={classes.axisTitle}>count / day</span>
      {/* Tick-value gutter: each label vertically centered on its gridline. */}
      <div className={classes.tickGutter}>
        {ticks.map((tick) => (
          <span
            key={tick}
            className={classes.tickValue}
            style={{ bottom: `${(tick / max) * 100}%` }}
          >
            {formatTick(tick)}
          </span>
        ))}
      </div>
      <div className={classes.chartColumn}>
        <div className={classes.plotArea}>
          {/* Gridlines first in DOM order so the bars paint over them. */}
          {ticks.map((tick) => (
            <div
              key={tick}
              className={classes.gridline}
              style={{ bottom: `${(tick / max) * 100}%` }}
            />
          ))}
          {data.map((point, index) => (
            <div
              key={point.date}
              className={classes.dayColumn}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered((current) => (current === index ? null : current))}
            >
              {/* Hover hit-area highlight so the whole column, not just the
                  bar, signals which day the tooltip describes. */}
              <div className={classes.dayHighlight} />
              <div
                className={classes.secondaryBar}
                style={{ height: `${(point.secondary / max) * 100}%` }}
              />
              <div
                className={classes.primaryBar}
                style={{ height: `${(point.primary / max) * 100}%` }}
              />
              {hovered === index && (
                <div
                  className={classNames(
                    classes.tooltip,
                    // Flip anchoring near the edges so the card stays on-screen.
                    index < data.length / 2 ? classes.tooltipLeft : classes.tooltipRight,
                  )}
                >
                  <div className={classes.tooltipTitle}>{formatDay(point.date)}</div>
                  <div className={classNames(classes.tooltipRow, classes.tooltipRowFirst)}>
                    <span className={classes.legendSwatchLabel}>
                      <span className={classNames(classes.swatch, classes.swatchSecondary)} />
                      {secondaryLabel}
                    </span>
                    <span>{point.secondary.toLocaleString()}</span>
                  </div>
                  <div className={classes.tooltipRow}>
                    <span className={classes.legendSwatchLabel}>
                      <span className={classNames(classes.swatch, classes.swatchPrimary)} />
                      {primaryLabel}
                    </span>
                    <span>{point.primary.toLocaleString()}</span>
                  </div>
                  {shareLabel && (
                    <div className={classes.tooltipShare}>
                      {primaryShare(point.secondary, point.primary).toFixed(0)}% {shareLabel}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className={classes.footer}>
          <span>{formatDay(data[0].date)}</span>
          <span className={classes.footerLegend}>
            <span className={classes.legendSwatchLabel}>
              <span className={classNames(classes.swatch, classes.swatchSecondary)} />
              {secondaryLabel}
            </span>
            <span className={classes.legendSwatchLabel}>
              <span className={classNames(classes.swatch, classes.swatchPrimary)} />
              {primaryLabel}
            </span>
            {shareLabel && (
              <span className={classes.footerShare}>
                {overallShare.toFixed(0)}% {shareLabel}
              </span>
            )}
          </span>
          <span>{formatDay(data[data.length - 1].date)}</span>
        </div>
      </div>
    </div>
  );
};

export default UsageDailyBarChart;
