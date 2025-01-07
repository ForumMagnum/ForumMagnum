import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import * as _ from 'underscore';

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
const styles = (_theme: ThemeType) => rowStyles;

const MigrationsDashboardRow = ({migration: {name, dateWritten, runs, lastRun}, classes}: {
  migration: any,
  classes: ClassesType<typeof styles>
}) => {
  const [expanded, setExpanded] = React.useState(false);
  
  let status;
  if (runs.length === 0) {
    status = "Not run";
  } else if (_.some(runs, (run: any): boolean=>run.succeeded)) {
    status = "Succeeded";
  } else if (_.some(runs, (run: any): boolean=>!run.finished)) {
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

const MigrationsDashboardRowComponent = registerComponent(
  "MigrationsDashboardRow", MigrationsDashboardRow, {
    styles
  }
);

declare global {
  interface ComponentTypes {
    MigrationsDashboardRow: typeof MigrationsDashboardRowComponent
  }
}
