import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { FilterMode } from '../../lib/filterSettings';
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
    cursor: "pointer",
    
    "&:hover": {
      opacity: 0.5,
    },
  },
  arrowLeft: {
    transform: 'rotate(-90deg)',
  },
  arrowRight: {
    transform: 'rotate(90deg)',
  },
  state: {
    width: 40,
    textAlign: "center",
    cursor: "pointer",
    
    "&:hover": {
      opacity: 0.5,
    },
  },
});

const maxFilterStrength = 50;
const filterStrengthIncrement = 10;

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
    } else if (mode === "Default") {
      onChangeMode(-filterStrengthIncrement);
    } else if (typeof mode === "number") {
      if (mode<=-maxFilterStrength) onChangeMode("Hidden")
      else if (mode-filterStrengthIncrement === 0) onChangeMode("Default");
      else onChangeMode(mode-filterStrengthIncrement);
    }
  }
  const filterMorePositive = () => {
    if (mode === "Hidden") {
      onChangeMode(-maxFilterStrength);
    } else if (mode === "Default") {
      onChangeMode(filterStrengthIncrement);
    } else if (typeof mode === "number") {
      if (mode>=maxFilterStrength) onChangeMode("Required");
      else if (mode+filterStrengthIncrement === 0) onChangeMode("Default");
      else onChangeMode(mode+filterStrengthIncrement);
    }
  }
  
  return <LWTooltip title={filterModeToTooltip(mode)} placement="bottom" className={classes.root}>
    <span className={classes.label}>
      {description}
      {helpTooltip && <LWTooltip title={helpTooltip}>
        <HelpIcon className={classes.helpIcon}/>
      </LWTooltip>}
    </span>
    
    <span className={classNames(classes.button, {[classes.selected]: mode==="Hidden"})} onClick={ev => onChangeMode("Hidden")}>
      Hidden
    </span>
    
    <span className={classNames(classes.arrowButton, classes.arrowLeft, {[classes.selected]: mode<0})} onClick={filterMoreNegative}>
      <UpArrowIcon/>
    </span>
    
    <span className={classNames(classes.state)} onClick={ev => onChangeMode("Default")}>
      {filterModeToStr(mode)}
    </span>
    
    <span className={classNames(classes.arrowButton, classes.arrowRight, {[classes.selected]: mode>0})} onClick={filterMorePositive}>
      <UpArrowIcon/>
    </span>
    
    <span className={classNames(classes.button, {[classes.selected]: mode==="Required"})} onClick={ev => onChangeMode("Required")}>
      Required
    </span>
  
    {canRemove ? <div className={classes.closeButton} onClick={ev => {
      if (onRemove)
        onRemove();
    }}>
      X
    </div> : <div className={classes.closeButton}/>}
  </LWTooltip>
}

function filterModeToTooltip(mode: FilterMode): string {
  switch (mode) {
    case "Required":
      return "ONLY posts with this attribute will be shown."
    case "Hidden":
      return "Posts with this attribute will be hidden."
    case 0:
    case "Default":
      return "This attribute will be ignored for filtering and sorting."
    default:
      if (mode<0)
        return `These posts will be shown less (as though their score were ${-mode} points lower).`
      else
        return `These posts will be shown more (as though their score were ${mode} points higher).`
  }
}

function filterModeToStr(mode: FilterMode): string {
  if (typeof mode === "number") {
    if (mode>0) return `+${mode}`;
    else if (mode===0) return "Default";
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
