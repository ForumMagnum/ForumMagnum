import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { FilterMode, filterTooltips } from '../../lib/filterSettings';
import classNames from 'classnames';
import HelpIcon from '@material-ui/icons/Help';
import UpArrowIcon from '@material-ui/icons/KeyboardArrowUp';

const styles = theme => ({
  root: {
    borderBottom: '1px solid rgba(0,0,0,0.1)',
    display: "flex",
    alignItems: "center",
    paddingLeft: 12
  },
  label: {
    marginRight: "auto"
  },
  button: {
    cursor: 'pointer',
    margin: 4,
    padding: 8,
    textTransform: 'uppercase',
    textAlign: 'center',
    display: 'inline-block',
    fontWeight: 500,
    marginLeft: 10
  },
  selected: {
    color: 'hsla(125, 23%, 47%, 1)',
  },
  closeButton: {
    width: 10,
    color: theme.palette.grey[500],
    cursor: "pointer"
  },
  helpIcon: {
    color: theme.palette.grey[400],
    height: 16,
    verticalAlign: "middle",
    display: "inline",
  },
  
  arrowButton: {
  },
  arrowLeft: {
    transform: 'rotate(-90deg)',
  },
  arrowRight: {
    transform: 'rotate(90deg)',
  },
});

const maxFilterStrength = 50;

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
  
  const filterMoreNegative = () => {
    if (mode === "Required") {
      onChangeMode(maxFilterStrength);
    } else if (typeof mode === "number") {
      if (mode<=-maxFilterStrength) onChangeMode("Hidden")
      else onChangeMode(mode-10);
    }
  }
  const filterMorePositive = () => {
    if (mode === "Hidden") {
      onChangeMode(-maxFilterStrength);
    } else if (typeof mode === "number") {
      if (mode>=maxFilterStrength) onChangeMode("Required")
      else onChangeMode(mode+10);
    }
  }
  
  return <div className={classes.root}>
    <span className={classes.label}>
      {description} {helpTooltip && <LWTooltip title={helpTooltip}>
          <HelpIcon className={classes.helpIcon}/>
        </LWTooltip>}
    </span>
    
    <LWTooltip title="These posts will not appear on the home page">
      <span className={classNames(classes.button, {[classes.selected]: mode==="Hidden"})} onClick={ev => onChangeMode("Hidden")}>
        Hidden
      </span>
    </LWTooltip>
    
    <LWTooltip title="These posts will appear on the home page (sorted normally)">
      <span className={classNames(classes.button, {[classes.selected]: mode==="Default"})} onClick={ev => onChangeMode("Default")}>
        Default
      </span>
    </LWTooltip>
    
    <span className={classNames(classes.arrowButton, classes.arrowLeft)} onClick={filterMoreNegative}>
      <UpArrowIcon/>
    </span>
    
    <span className={classes.state}>{filterModeToStr(mode)}</span>
    
    <span className={classNames(classes.arrowButton, classes.arrowRight)} onClick={filterMorePositive}>
      <UpArrowIcon/>
    </span>
    
    <LWTooltip title="The home page will ONLY show posts that you have marked as 'required.'">
      <span className={classNames(classes.button, {[classes.selected]: mode==="Required"})} onClick={ev => onChangeMode("Required")}>
        Required
      </span>
    </LWTooltip>
    
    {canRemove ? <div className={classes.closeButton} onClick={ev => {
      if (onRemove)
        onRemove();
    }}>
      X
    </div> : <div className={classes.closeButton}/>}
  </div>
}

function filterModeToStr(mode: FilterMode): string {
  if (typeof mode === "number") {
    if (mode>0) return `+${mode}`;
    else return `${mode}`;
  } else switch(mode) {
    default:
    case "Default": return "Default";
    case "Hidden": return "-∞";
    case "Required": return "+∞";
  }
}

const FilterModeComponent = registerComponent("FilterMode", FilterModeRawComponent, {styles});

declare global {
  interface ComponentTypes {
    FilterMode: typeof FilterModeComponent
  }
}
