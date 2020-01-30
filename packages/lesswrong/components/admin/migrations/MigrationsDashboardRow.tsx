import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import * as _ from 'underscore';

const styles = theme => ({
  root: {},
  row: {
    display: "flex",
    cursor: "pointer",
  },
  name: {
    marginRight: 10,
    flexGrow: 1,
  },
  date: {
    marginRight: 10,
    minWidth: 80,
  },
  status: {
    minWidth: 120,
  },
});

const MigrationsDashboardRow = ({migration: {name, dateWritten, runs}, classes}) => {
  const [expanded, setExpanded] = React.useState(false);
  
  let status;
  if (runs.length === 0) {
    status = "Not run";
  } else if (_.some(runs, run=>run.succeeded)) {
    status = "Succeeded";
  } else if (_.some(runs, run=>!run.finished)) {
    status = "In Progress";
  } else {
    status = "Failed";
  }
  
  const toggleExpanded = React.useCallback(
    ev => setExpanded(!expanded),
    [expanded, setExpanded]
  );
  
  return <div className={classes.root}>
    <div className={classes.row} onClick={toggleExpanded}>
      <span className={classes.name}>{name}</span>
      <span className={classes.date}>{dateWritten}</span>
      <span className={classes.status}>{status}</span>
    </div>
    {expanded && <ul className={classes.runs}>
      {runs.map(run => <li key={run.started}>
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
