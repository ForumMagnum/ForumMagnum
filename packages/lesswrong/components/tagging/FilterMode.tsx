import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { FilterMode } from '../../lib/filterSettings';
import classNames from 'classnames';
import withHover from '../common/withHover';
import { useSingle } from '../../lib/crud/withSingle';
import { Tags } from '../../lib/collections/tags/collection';
import { tagStyle } from './FooterTag';

const styles = theme => ({
  tag: {
    ...tagStyle(theme),
    display: "inline-block",
    marginBottom: 4,
    marginRight: 4
  },
  filterScore: {
    color: 'rgba(0,0,0,0.7)',
    fontSize: ".9em"
  },
  filtering: {
    marginLeft: 16,
    marginTop: 16,
    ...theme.typography.commentStyle
  },
  filterButton: {
    marginTop: 8,
    marginRight: 8,
    padding: 4,
    paddingLeft: 8,
    paddingRight: 8,
    ...theme.typography.smallText,
    display: "inline-block",
    cursor: "pointer",
    borderRadius: 2,
    border: "solid 1px rgba(0,0,0,.1)",
  },
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
    backgroundColor: "rgba(0,0,0,.1)",
    border: "none"
  },
  closeButton: {
    width: 10,
    color: theme.palette.grey[500],
    cursor: "pointer",
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

const FilterModeRawComponent = ({tagId="", label, hover, anchorEl, mode, canRemove=false, onChangeMode, onRemove, helpTooltip, classes}: {
  tagId?: string,
  label?: string,
  mode: FilterMode,
  canRemove?: boolean,
  onChangeMode: (mode: FilterMode)=>void,
  onRemove?: ()=>void,
  helpTooltip?: any,
  classes: ClassesType,
  hover?: boolean,
  anchorEl?: any
}) => {
  const { LWTooltip, PopperCard, TagPreview } = Components
  
  const { document: tag } = useSingle({
    documentId: tagId,
    collection: Tags,
    fragmentName: "TagPreviewFragment",
  })
  return <span>
    <span className={classes.tag}> 
      {label}
      <span className={classes.filterScore}>
        {filterModeToStr(mode)}
      </span>
      {canRemove && <div className={classes.closeButton} onClick={ev => {if (onRemove) onRemove()}}>
          X
        </div>}
    </span>
    <PopperCard open={!!hover} anchorEl={anchorEl} placement="bottom" 
      modifiers={{
        flip: {
          behavior: ["bottom-start", "top-end", "bottom-start"],
          boundariesElement: 'viewport'
        }
      }}
    >
      <div className={classes.filtering}>
        <div className={classes.filterLabel}>
          Set Filter:
        </div>
        <div>
          <LWTooltip title={filterModeToTooltip("Hidden")}>
            <span className={classNames(classes.filterButton, {[classes.selected]: mode==="Hidden"})} onClick={ev => onChangeMode("Hidden")}>
              Hidden
            </span>
          </LWTooltip>
          <LWTooltip title={filterModeToTooltip(-50)}>
            <span className={classNames(classes.filterButton, {[classes.selected]: mode===-50})} onClick={ev => onChangeMode(-50)}>
              -50
            </span>
          </LWTooltip>
          <LWTooltip title={filterModeToTooltip(-25)}>
            <span className={classNames(classes.filterButton, {[classes.selected]: mode===-25})} onClick={ev => onChangeMode(-25)}>
              -25
            </span>
          </LWTooltip>
          <LWTooltip title={filterModeToTooltip(-10)}>
            <span className={classNames(classes.filterButton, {[classes.selected]: mode===-10})} onClick={ev => onChangeMode(-10)}>
              -10
            </span>
          </LWTooltip>
          <LWTooltip title={filterModeToTooltip("Default")}>
            <span className={classNames(classes.filterButton, {[classes.selected]: mode==="Default"})} onClick={ev => onChangeMode(0)}>
              Normal
            </span>
          </LWTooltip>
          <LWTooltip title={filterModeToTooltip(10)}>
            <span className={classNames(classes.filterButton, {[classes.selected]: mode===10})} onClick={ev => onChangeMode(10)}>
              +10
            </span>
          </LWTooltip>
          <LWTooltip title={filterModeToTooltip(25)}>
            <span className={classNames(classes.filterButton, {[classes.selected]: mode===25})} onClick={ev => onChangeMode(25)}>
              +25
            </span>
          </LWTooltip>
          <LWTooltip title={filterModeToTooltip(50)}>
            <span className={classNames(classes.filterButton, {[classes.selected]: mode===50})} onClick={ev => onChangeMode(50)}>
              +50
            </span>
          </LWTooltip>
          <LWTooltip title={filterModeToTooltip("Required")}>
            <span className={classNames(classes.filterButton, {[classes.selected]: mode==="Required"})} onClick={ev => onChangeMode("Required")}>
              Required
            </span>
          </LWTooltip>
        </div>
      </div>
      <TagPreview tag={tag}/>
    </PopperCard>
  </span>
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
    else if (mode===0) return "+0";
    else return `${mode}`;
  } else switch(mode) {
    default:
    case "Default": return "+0";
    case "Hidden": return "-∞";
    case "Required": return "+∞";
  }
}

const FilterModeComponent = registerComponent("FilterMode", FilterModeRawComponent, {styles, hocs: [withHover()]});

declare global {
  interface ComponentTypes {
    FilterMode: typeof FilterModeComponent
  }
}
