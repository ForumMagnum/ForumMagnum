import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { FilterMode, filterModes, filterTooltips } from '../../lib/filterSettings';
import classNames from 'classnames';
import HelpIcon from '@material-ui/icons/Help';

const styles = theme => ({
  root: {
    borderBottom: '1px solid rgba(0,0,0,0.1)',
  },
  label: {
    width: 135,
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
  helpIcon: {
    color: theme.palette.grey[400],
    height: 16,
    verticalAlign: "middle",
    display: "inline",
  }
});

const FilterModeRawComponent = ({description, mode, canRemove=false, onChangeMode, onRemove, helpTooltip, classes}: {
  description: string,
  mode: FilterMode,
  canRemove?: boolean,
  onChangeMode: (mode: FilterMode)=>void,
  onRemove?: ()=>void,
  helpTooltip?: any,
  classes: ClassesType,
}) => {
  const { LWTooltip } = Components
  return <div className={classes.root}>
    <span className={classes.label}>
      {description} {helpTooltip && <HelpIcon className={classes.helpIcon}/>}
    </span>
    
    {filterModes.map((m: FilterMode) =>
      <LWTooltip key={m} title={filterTooltips[m]}>
        <span className={classNames(classes.button, {[classes.selected]: m===mode})} onClick={ev => onChangeMode(m)}>
          {m}
        </span>
      </LWTooltip>
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
