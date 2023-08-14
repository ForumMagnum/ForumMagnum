import React, { useCallback, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { requireCssVar } from "../../themes/cssVars";
import moment from "moment";
import { AnalyticsField, analyticsFieldsList, useAnalyticsSeries } from "../hooks/useAnalytics";
import startCase from "lodash/startCase";
import Checkbox, { CheckboxProps } from "@material-ui/core/Checkbox";
import { useDialog } from "../common/withDialog";
import { isEAForum } from "../../lib/instanceSettings";

const GRAPH_HEIGHT = 300;

// lw-look-here
// TODO Add these back in
const missingClientRangeText = isEAForum ? "Jan 11th - Jun 14th of 2021" : "late 2020 - early 2021";
const missingClientLastDay = isEAForum ? "2021-06-14" : "2021-05-01";
const dataCollectionFirstDay = isEAForum ? "Feb 19th, 2020" : "around the start of 2020";

const styles = (theme: ThemeType): JssStyles => ({
  graphContainer: {
    marginTop: 12,
    "& .recharts-cartesian-axis-tick-value": {
      fontWeight: 600,
    },
  },
  graphHeader: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: "row",
    marginBottom: 12,
    [theme.breakpoints.down('xs')]: {
      flexDirection: "column",
      // Make it the same height with or without "checking latest data..." to avoid layout shift on mobile
      minHeight: 56,
      marginBottom: 0,
    }
  },
  graphHeading: {
    fontSize: 32,
    fontWeight: "600",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
    [theme.breakpoints.down('xs')]: {
      lineHeight: '1.2em',
    }
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
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    [theme.breakpoints.down('xs')]: {
      flexDirection: "column",
    }
  },
  controlFields: {
    display: "flex",
    flexDirection: "row",
    color: theme.palette.grey[600],
    fontSize: 14,
    fontWeight: 500,
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      display: "grid",
      // Flow into grid with 2 per row on large screens, 1 per row on small screens. Ideally never 3 per row.
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    },
  },
  fieldLabel: {
    display: "flex",
    alignItems: "center",
  },
  checkbox: {
    padding: '8px 12px',
  },
  checkboxIcon: {
    width: 20,
    height: 20,
    border: `2px solid ${theme.palette.grey[600]}`,
    borderRadius: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  checkedInnerIcon: {
    width: 14,
    height: 14,
    borderRadius: 2,
    display: "inline-block",
    opacity: 0.8,
  },
  dateDropdown: {
    alignSelf: "flex-start",
    margin: '4px 0'
  }
});

const LINE_COLORS: Record<AnalyticsField, string> = {
  reads: requireCssVar("palette", "primary", "main"),
  views: requireCssVar("palette", "primary", "light"),
  karma: requireCssVar("palette", "graph", "analyticsKarma"),
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
} as const

const startEndDateFromOption = (option: string) => {
  const now = new Date();
  switch (option) {
    case dateOptions.last7Days.value:
      return {
        startDate: moment(now).subtract(7, "days").startOf("day").toDate(),
        endDate: moment(now).endOf("day").toDate(),
      };
    case dateOptions.last30Days.value:
      return {
        startDate: moment(now).subtract(30, "days").startOf("day").toDate(),
        endDate: moment(now).endOf("day").toDate(),
      };
    case dateOptions.last90Days.value:
      return {
        startDate: moment(now).subtract(90, "days").startOf("day").toDate(),
        endDate: moment(now).endOf("day").toDate(),
      };
    case dateOptions.allTime.value:
      return {
        startDate: null,
        endDate: moment(now).endOf("day").toDate(),
      };
    default:
      return {
        startDate: moment(now).subtract(90, "days").startOf("day").toDate(),
        endDate: moment(now).endOf("day").toDate(),
      };
  }
}

interface ColoredCheckboxProps extends CheckboxProps {
  fillColor: string;
  classes: ClassesType;
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
  title,
  classes,
}: {
  initialDisplayFields?: AnalyticsField[];
  userId?: string;
  postIds?: string[];
  title: string;
  classes: ClassesType;
}) => {
  const { Typography, ForumDropdown } = Components;

  const [displayFields, setDisplayFields] = useState<AnalyticsField[]>(initialDisplayFields);
  const [dateOption, setDateOption] = useState<string>(dateOptions.last30Days.value);
  
  const now = new Date();

  const {startDate: fallbackStartDate, endDate: fallbackEndDate} = startEndDateFromOption(dateOption);
  const [displayStartDate, setDisplayStartDate] = useState<Date | null>(fallbackStartDate);
  const [displayEndDate, setDisplayEndDate] = useState<Date>(fallbackEndDate);

  const { openDialog } = useDialog();

  const { analyticsSeries: dataSeries, maybeStale } = useAnalyticsSeries({
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
        componentName: 'DateRangeModal',
        componentProps: {
          startDate: displayStartDate,
          endDate: displayEndDate,
          updateDisplayDates
        },
      });
    }
  }, [displayEndDate, displayStartDate, openDialog, updateDisplayDates]);

  const dataSeriesToDisplay = dataSeries?.map((dataPoint) => {
    // only select the fields we want to display
    return {
      date: dataPoint.date,
      ...displayFields.reduce((acc, field) => {
        acc[field] = dataPoint[field] ?? 0;
        return acc;
      }, {} as Partial<Record<AnalyticsField, number>>),
    };
  });

  const getTooltipContent = useCallback(({ active, payload, label }: AnyBecauseHard) => {
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
  const strokeWidth = dataSeriesToDisplay.length > 180 ? 2 : 3;

  return (
    <div>
      <div className={classes.graphHeader}>
        <Typography variant="headline" className={classes.graphHeading}>
          {title}
        </Typography>
        {maybeStale && <span className={classes.fetchingLatest}>
          checking latest data...
        </span>}
      </div>
      <div className={classes.controls}>
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
        <ForumDropdown value={dateOption} options={dateOptions} className={classes.dateDropdown} onSelect={handleDateOptionChange} />
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
    </div>
  );
};

const AnalyticsGraphComponent = registerComponent("AnalyticsGraph", AnalyticsGraph, { styles });

declare global {
  interface ComponentTypes {
    AnalyticsGraph: typeof AnalyticsGraphComponent;
  }
}
