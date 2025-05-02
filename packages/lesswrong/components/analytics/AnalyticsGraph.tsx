import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipProps } from "recharts";
import { requireCssVar } from "../../themes/cssVars";
import moment from "moment";
import { AnalyticsField, analyticsFieldsList, useAnalyticsSeries } from "../hooks/useAnalytics";
import startCase from "lodash/startCase";
import Checkbox, { CheckboxProps } from "@/lib/vendor/@material-ui/core/src/Checkbox";
import { useDialog } from "../common/withDialog";

const CONTROLS_BREAKPOINT = 650;

export const GRAPH_HEIGHT = 300;

/**
 * The garph is rendered as an SVG which includes a built-in left margin - this
 * constant is the offset we need to apply to other elements to make them
 * line up nicely with the graph.
 */
export const GRAPH_LEFT_MARGIN = 14;

export const styles = (theme: ThemeType) => ({
  root: {
    overflow: "auto hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "12px",
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  graphContainer: {
    marginTop: 12,
    "& .recharts-cartesian-axis-tick-value": {
      fontWeight: 500,
    },
  },
  fetchingLatest: {
    fontSize: 14,
    color: theme.palette.grey[600],
    fontWeight: 500,
    // stick to bottom
    alignSelf: "flex-end",
    [theme.breakpoints.down('xs')]: {
      alignSelf: "flex-start",
      marginBottom: 'auto',
    }
  },
  tooltip: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.dropdown.border}`,
    boxShadow: theme.palette.boxShadow.graphTooltip,
    padding: 10,
    borderRadius: theme.borderRadius.small,
  },
  date: {
    fontStyle: theme.palette.fonts.sansSerifStack,
    fontSize: 12,
    fontWeight: 600,
  },
  tooltipLabel: {
    fontStyle: theme.palette.fonts.sansSerifStack,
    fontSize: 12,
    fontWeight: 500,
  },
  notEnoughDataMessage: {
    color: theme.palette.grey[500],
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  controls: {
    display: "flex",
    alignItems: "flex-end",
    gap: "32px",
    width: "100%",
    paddingLeft: 18,
    paddingRight: 28,
    [`@media(max-width: ${CONTROLS_BREAKPOINT}px)`]: {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "20px",
    }
  },
  controlFields: {
    display: "flex",
    flexDirection: "row",
    color: theme.palette.grey[900],
    fontSize: 14,
    fontWeight: 500,
    marginBottom: -6,
    [`@media(max-width: ${CONTROLS_BREAKPOINT}px)`]: {
      flexWrap: "wrap",
      marginLeft: -14,
    },
  },
  fieldLabel: {
    display: "flex",
    alignItems: "center",
    ["@media(max-width: 440px)"]: {
      flexBasis: "50%",
    },
    ["@media(max-width: 290px)"]: {
      flexBasis: "100%",
    },
  },
  checkbox: {
    padding: '8px 6px 8px 16px',
  },
  checkboxIcon: {
    width: 17,
    height: 17,
    border: `1px solid ${theme.palette.grey[900]}`,
    borderRadius: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  checkedInnerIcon: {
    width: 11,
    height: 11,
    borderRadius: 2,
    display: "inline-block",
    opacity: 0.8,
  },
  dateDropdown: {
    marginLeft: 4,
    marginBottom: 16,
    color: theme.palette.grey[1000],
    "& .MuiButton-label": {
      fontSize: 18,
      fontWeight: 600,
    },
  },
  overallStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontSize: 13,
    fontWeight: 500,
  },
  overallStatContainer: {
    display: "flex",
    gap: "32px",
    flexGrow: 1,
  },
  overallStatCount: {
    fontSize: 32,
    fontWeight: 700,
  },
  overallStatTooltip: {
    maxWidth: 150,
    color: theme.palette.grey[0],
    background: theme.palette.grey[1000],
    fontFamily: theme.palette.fonts.sansSerifStack,
    borderRadius: theme.borderRadius.default,
    padding: "6px 10px",
    textAlign: "center",
    fontSize: 12,
    fontWeight: 500,
  },
});

const LINE_COLORS: Record<AnalyticsField, string> = {
  reads: requireCssVar("palette", "graph", "analyticsReads"),
  views: requireCssVar("palette", "primary", "main"),
  karma: requireCssVar("palette", "primary", "light"),
  comments: requireCssVar("palette", "grey", 800),
};

const dateOptions = {
  last7Days: {
    label: "Last 7 days",
    value: "last7Days",
  },
  last30Days: {
    label: "Last 30 days",
    value: "last30Days",
  },
  last90Days: {
    label: "Last 90 days",
    value: "last90Days",
  },
  allTime: {
    label: "All time",
    value: "allTime",
  },
  custom: {
    label: "Custom",
    value: "custom",
  }
} as const;

const startEndDateFromOption = (option: string) => {
  const now = new Date();
  switch (option) {
    case dateOptions.last7Days.value:
      return {
        startDate: moment(now).utc().subtract(7, "days").startOf("day").toDate(),
        endDate: moment(now).utc().endOf("day").toDate(),
      };
    case dateOptions.last30Days.value:
      return {
        startDate: moment(now).utc().subtract(30, "days").startOf("day").toDate(),
        endDate: moment(now).utc().endOf("day").toDate(),
      };
    case dateOptions.last90Days.value:
      return {
        startDate: moment(now).utc().subtract(90, "days").startOf("day").toDate(),
        endDate: moment(now).utc().endOf("day").toDate(),
      };
    case dateOptions.allTime.value:
      return {
        startDate: null,
        endDate: moment(now).utc().endOf("day").toDate(),
      };
    default:
      return {
        startDate: moment(now).utc().subtract(90, "days").startOf("day").toDate(),
        endDate: moment(now).utc().endOf("day").toDate(),
      };
  }
}

interface ColoredCheckboxProps extends CheckboxProps {
  fillColor: string;
  classes: ClassesType<typeof styles>;
}

const ColoredCheckbox: React.FC<ColoredCheckboxProps> = ({ fillColor, classes, ...props }: ColoredCheckboxProps) => {
  return (
    <Checkbox
      className={classes.checkbox}
      icon={<span className={classes.checkboxIcon}></span>}
      checkedIcon={
        <span className={classes.checkboxIcon}>
          <span className={classes.checkedInnerIcon} style={{ backgroundColor: fillColor }}></span>
        </span>
      }
      {...props}
    />
  );
};

export const AnalyticsGraph = ({
  userId,
  postIds,
  initialDisplayFields = ["views", "reads"],
  disclaimerEarliestDate,
  classes,
}: {
  initialDisplayFields?: AnalyticsField[];
  userId?: string;
  postIds?: string[];
  disclaimerEarliestDate?: Date,
  classes: ClassesType<typeof styles>;
}) => {
  const {Typography, ForumDropdown, LWTooltip} = Components;

  const [displayFields, setDisplayFields] = useState<AnalyticsField[]>(initialDisplayFields);
  const [dateOption, setDateOption] = useState<string>(dateOptions.last30Days.value);

  const {startDate: fallbackStartDate, endDate: fallbackEndDate} = startEndDateFromOption(dateOption);
  const [displayStartDate, setDisplayStartDate] = useState<Date | null>(fallbackStartDate);
  const [displayEndDate, setDisplayEndDate] = useState<Date>(fallbackEndDate);

  const { openDialog } = useDialog();

  const {analyticsSeries: dataSeries, loading} = useAnalyticsSeries({
    userId,
    postIds,
    startDate: displayStartDate,
    endDate: displayEndDate,
  });

  const toggleField = (field: AnalyticsField) => {
    if (displayFields.includes(field) && displayFields.length > 1) {
      setDisplayFields((prev) => prev.filter((f) => f !== field));
    } else {
      setDisplayFields((prev) => [...prev, field]);
    }
  };

  const updateDisplayDates = useCallback((startDate: Date | null, endDate: Date) => {
    setDisplayStartDate(startDate);
    setDisplayEndDate(endDate);
  }, []);

  const handleDateOptionChange = useCallback((option: string) => {
    setDateOption(option);

    if (option !== dateOptions.custom.value) {
      const {startDate, endDate} = startEndDateFromOption(option);
      updateDisplayDates(startDate, endDate);
    } else {
      openDialog({
        name: 'DateRangeModal',
        contents: ({onClose}) => <Components.DateRangeModal
          onClose={onClose}
          startDate={displayStartDate}
          endDate={displayEndDate}
          updateDisplayDates={updateDisplayDates}
        />,
      });
    }
  }, [displayEndDate, displayStartDate, openDialog, updateDisplayDates]);

  const dataSeriesToDisplay = dataSeries?.map((dataPoint) => {
    // only select the fields we want to display
    return {
      date: dataPoint.date,
      ...displayFields.reduce<Partial<Record<AnalyticsField, number>>>((acc, field) => {
        acc[field] = dataPoint[field] ?? 0;
        return acc;
      }, {}),
    };
  });

  const overallStats = dataSeries.reduce((totals, dataPoint) => {
    totals.views += dataPoint.views ?? 0;
    totals.reads += dataPoint.reads ?? 0;
    return totals;
  }, {views: 0, reads: 0});

  const getTooltipContent = useCallback(({ active, payload }: TooltipProps<string, string>) => {
    if (!(active && payload && payload.length)) return null;

    const date = new Date(payload[0].payload["date"]);

    return (
      <div className={classes.tooltip}>
        <p className={classes.date}>{moment(date).format("MMM DD YYYY")}</p>
        {displayFields.map((field) => (
          <p key={field} className={classes.tooltipLabel}>
            {`${startCase(field)}: ${payload[0].payload[field].toLocaleString()}`}
          </p>
        ))}
      </div>
    );
  }, [classes.date, classes.tooltip, classes.tooltipLabel, displayFields]);

  const dateOptionDropdown = (
    <ForumDropdown
      value={dateOption}
      options={dateOptions}
      onSelect={handleDateOptionChange}
      className={classes.dateDropdown}
    />
  );

  const {AnalyticsGraphSkeleton, AnalyticsDisclaimers} = Components;
  if (loading || (!userId && !postIds?.length)) {
    return (
      <AnalyticsGraphSkeleton dateOptionDropdown={dateOptionDropdown} />
    );
  }

  if (!dataSeriesToDisplay?.length || dataSeriesToDisplay.length === 1) {
    return (
      <Typography variant="body1" className={classes.notEnoughDataMessage}>
        <em>Not enough data for a graph</em>
      </Typography>
    );
  }

  const maxValue = dataSeriesToDisplay.reduce((maxVal, dataPoint) => {
    const currentMaxValue = Math.max(...displayFields.map(field => dataPoint[field as AnalyticsField] ?? 0));
    return Math.max(maxVal, currentMaxValue);
  }, 0);

  // Unfortunately this is the best workaround, see here: https://github.com/recharts/recharts/issues/2027
  const yAxisWidth = 26 + Math.ceil(maxValue.toLocaleString().length * 6);
  const strokeWidth = dataSeriesToDisplay.length > 180 ? 2 : 2;

  return (
    <div className={classes.root}>
      {dateOptionDropdown}
      <div className={classes.controls}>
        <div className={classes.overallStatContainer}>
          <LWTooltip
            title="When someone clicks on your post it’s counted as a view"
            placement="bottom"
            tooltip={false}
            popperClassName={classes.overallStatTooltip}
            className={classes.overallStat}
          >
            <div className={classes.overallStatCount}>{overallStats.views}</div>
            <div>Views</div>
          </LWTooltip>
          <LWTooltip
            title="When someone views your post for longer than 30 sec it’s counted as a read"
            placement="bottom"
            tooltip={false}
            popperClassName={classes.overallStatTooltip}
            className={classes.overallStat}
          >
            <div className={classes.overallStatCount}>{overallStats.reads}</div>
            <div>Reads</div>
          </LWTooltip>
        </div>
        <div className={classes.controlFields}>
          {analyticsFieldsList.map((field) => (
            <label key={field} className={classes.fieldLabel}>
              <ColoredCheckbox
                checked={displayFields.includes(field)}
                onChange={() => toggleField(field as AnalyticsField)}
                classes={classes}
                fillColor={LINE_COLORS[field]}
              />
              {startCase(field)}
            </label>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={GRAPH_HEIGHT} className={classes.graphContainer}>
        <LineChart data={dataSeriesToDisplay} height={300} margin={{ right: 30 }}>
          <XAxis
            dataKey="date"
            interval={Math.floor(dataSeriesToDisplay.length / 5)}
            tickFormatter={(v: Date) => moment(v).format("MMM DD")}
          />
          <YAxis width={yAxisWidth} tickFormatter={(v: number) => v.toLocaleString()} />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip content={getTooltipContent} />
          {displayFields.map((field) => (
            <Line key={field} dataKey={field} stroke={LINE_COLORS[field]} strokeWidth={strokeWidth} dot={false} animationDuration={300} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <AnalyticsDisclaimers
        earliestDate={disclaimerEarliestDate ?? displayStartDate ?? new Date(0)}
      />
    </div>
  );
};

const AnalyticsGraphComponent = registerComponent(
  "AnalyticsGraph",
  AnalyticsGraph,
  {styles},
);

declare global {
  interface ComponentTypes {
    AnalyticsGraph: typeof AnalyticsGraphComponent;
  }
}
