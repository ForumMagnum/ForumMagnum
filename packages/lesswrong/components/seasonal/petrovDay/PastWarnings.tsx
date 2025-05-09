import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: theme.palette.border.commentBorder,
    textAlign: 'center'
  },
  report: {
    marginTop: 8,
    fontSize: '1rem',
    color: theme.palette.grey[600],
    '& em': {
      color: theme.palette.grey[500],
      fontSize: '.8rem',
      marginLeft: 8
    }
  },
  alert: {
    color: theme.palette.error.main,
    fontSize: "3rem"
  },
  date: {
    color: theme.palette.grey[500],
    fontSize: ".8rem",
    marginLeft: 8
  },
  alertTime: {
    color: theme.palette.error.main,
    display: "block",
    fontSize: "1.2rem",
    marginLeft: 0
  }
});

export const PastWarningsInner = ({classes, petrovDayActions, side, general}: {
  classes: ClassesType<typeof styles>,
  petrovDayActions: PetrovDayActionInfo[],
  side: 'east' | 'west',
  general?: boolean
}) => {
  const reports = side === 'east' ? petrovDayActions.filter(action => action.actionType === 'eastPetrovAllClear' || action.actionType === 'eastPetrovNukesIncoming') : petrovDayActions.filter(action => action.actionType === 'westPetrovAllClear' || action.actionType === 'westPetrovNukesIncoming')
  
  return <div className={classes.root}>
    {reports.map(({_id, actionType, createdAt}) => <div key={_id} className={classNames(classes.report, general && actionType.includes("NukesIncoming") && classes.alert)}>
      {actionType.includes('AllClear') ? 'All Clear' : 'Nukes Incoming'} <span className={classNames(classes.date, general && actionType.includes("NukesIncoming") && classes.alertTime)}>{new Date(createdAt).toLocaleTimeString()}</span>
    </div>)}
    {reports.length === 0 && <em>No reports yet</em>}
  </div>;
}

export const PastWarnings = registerComponent('PastWarnings', PastWarningsInner, {styles});


