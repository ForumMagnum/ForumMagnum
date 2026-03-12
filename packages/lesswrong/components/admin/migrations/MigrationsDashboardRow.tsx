import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import React from 'react';

export const rowStyles = {
  root: {
    fontSize: 16,
    lineHeight: 1.3,
  },
  row: {
    display: "flex",
    cursor: "pointer",
  },
  name: {
    marginRight: 10,
    flexGrow: 1,
  },
  middleColumn: {
    marginRight: 10,
    minWidth: 100,
  },
  lastRun: {
    minWidth: 140,
  },
};
const styles = defineStyles("MigrationsDashboardRow", (_theme: ThemeType) => rowStyles);

const MigrationsDashboardRow = ({migration: {name, dateWritten, runs, lastRun}}: {
  migration: any,
}) => {
  const classes = useStyles(styles);
  const [expanded, setExpanded] = React.useState(false);
  
  let status;
  if (runs.length === 0) {
    status = "Not run";
  } else if (runs.some((run: any): boolean=>run.succeeded)) {
    status = "Succeeded";
  } else if (runs.some((run: any): boolean=>!run.finished)) {
    status = "In Progress";
  } else {
    status = "Failed";
  }
  
  const toggleExpanded = React.useCallback(
    (_ev: React.MouseEvent) => setExpanded(!expanded),
    [expanded, setExpanded]
  );
  
  return <div className={classes.root}>
    <div className={classes.row} onClick={toggleExpanded}>
      <span className={classes.name}>{name}</span>
      <span className={classes.middleColumn}>{dateWritten}</span>
      <span className={classes.middleColumn}>{status}</span>
      <span className={classes.lastRun}>{lastRun}</span>
    </div>
    {expanded && <ul>
      {runs.map((run: AnyBecauseTodo) => <li key={run.started}>
        Started {run.started}
        {run.finished && <>, finished {run.finished}</>}
        {run.failed && <>, FAILED</>}
      </li>)}
    </ul>}
  </div>
}

export default MigrationsDashboardRow;
