import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { FilterMode, filterModes } from '../../lib/filterSettings';
import classNames from 'classnames';

const styles = theme => ({
  root: {
    borderBottom: '1px solid rgba(0,0,0,0.1)',
  },
  label: {
    width: 130,
    display: "inline-block",
    verticalAlign: "middle",
  },
  button: {
    cursor: 'pointer',
    margin: 4,
    padding: 8,
    verticalAlign: 'middle',
    textTransform: 'uppercase',
    textAlign: 'center',
    display: 'inline-block',
    fontWeight: 500,
    marginRight: 10
  },
  selected: {
    color: 'hsla(125, 23%, 47%, 1)',
  },
  closeButton: {
    display: "inline-block",
    verticalAlign: "middle",
  },
});

const FilterModeRawComponent = ({description, mode, canRemove=false, onChangeMode, onRemove, classes}: {
  description: string,
  mode: FilterMode,
  canRemove?: boolean,
  onChangeMode: (mode: FilterMode)=>void,
  onRemove?: ()=>void,
  classes: ClassesType,
}) => {
  return <div className={classes.root}>
    <span className={classes.label}>{description}</span>
    
    {filterModes.map((m: FilterMode) =>
      <span key={m} className={classNames(classes.button, {[classes.selected]: m===mode})} onClick={ev => onChangeMode(m)}>
        {m}
      </span>
    )}
    {canRemove && <div className={classes.closeButton} onClick={ev => {
      if (onRemove)
        onRemove();
    }}>
      X
    </div>}
  </div>
}

const FilterModeComponent = registerComponent("FilterMode", FilterModeRawComponent, {styles});

declare global {
  interface ComponentTypes {
    FilterMode: typeof FilterModeComponent
  }
}
