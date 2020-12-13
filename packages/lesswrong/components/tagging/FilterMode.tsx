import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import type { FilterMode } from '../../lib/filterSettings';
import classNames from 'classnames';
import { useHover } from '../common/withHover';
import { useSingle } from '../../lib/crud/withSingle';
import { tagStyle } from './FooterTag';
import Input from '@material-ui/core/Input';
import { commentBodyStyles } from '../../themes/stylePiping'
import { Link } from '../../lib/reactRouterWrapper';
import { isMobile } from '../../lib/utils/isMobile'
import { AnalyticsContext } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType): JssStyles => ({
  tag: {
    ...tagStyle(theme),
    display: "inline-block",
    marginBottom: 4,
    marginRight: 4,
  },
  description: {
    ...commentBodyStyles(theme),
    margin: theme.spacing*2,
    marginTop: 20
  },
  filterScore: {
    color: theme.palette.primary.dark,
    fontSize: 11,
    marginLeft: 4,
  },
  filtering: {
    paddingLeft: 16,
    paddingTop: 12,
    paddingRight: 16,
    width: 500,
    marginBottom: -4,
    ...theme.typography.commentStyle,
    [theme.breakpoints.down('xs')]: {
      width: "calc(100% - 32px)",
    }
  },
  filterRow: {
    display: "flex",
    justifyContent: "flex-start",
    paddingBottom: 2,
    paddingLeft: 2,
    paddingRight: 2
  },
  removeLabel: {
    color: theme.palette.grey[600],
    flexGrow: 1,
    textAlign: "right"
  },
  filterButton: {
    marginRight: 16,
    color: theme.palette.grey[500],
    ...theme.typography.smallText,
    display: "inline-block",
    cursor: "pointer",
  },
  selected: {
    color: "black",
    backgroundColor: "rgba(0,0,0,.1)",
    padding: 4,
    paddingLeft: 8,
    paddingRight: 8,
    marginTop: -4,
    marginBottom: -4,
    borderRadius: 2,
  },
  input: {
    padding: 0,
    paddingBottom: 2,
    width: 50,
    "-webkit-appearance": "none",
    "-moz-appearance": "textfield"
  }
});

const FilterModeRawComponent = ({tagId="", label, mode, canRemove=false, onChangeMode, onRemove, description, classes}: {
  tagId?: string,
  label?: string,
  mode: FilterMode,
  canRemove?: boolean,
  onChangeMode: (mode: FilterMode)=>void,
  onRemove?: ()=>void,
  description?: React.ReactNode
  classes: ClassesType,
}) => {
  const { LWTooltip, PopperCard, TagPreview } = Components
  const { hover, anchorEl, eventHandlers } = useHover({ tagId, label, mode });

  const { document: tag } = useSingle({
    documentId: tagId,
    collectionName: "Tags",
    fragmentName: "TagPreviewFragment",
  })

  const tagLabel = <span className={classNames(classes.tag, {[classes.noTag]: !tagId})}>
    {label}
    <span className={classes.filterScore}>
      {filterModeToStr(mode)}
    </span>
  </span>

  const otherValue = ["Hidden", -25,-10,0,10,25,"Required"].includes(mode) ? "" : (mode || "")
  return <span {...eventHandlers}>
    <AnalyticsContext pageElementContext="tagFilterMode" tagId={tag?._id} tagName={tag?.name}>
      {(tag && !isMobile()) ? <Link to={`tag/${tag.slug}`}>
        {tagLabel}
      </Link>
      : tagLabel
      }
      <PopperCard open={!!hover} anchorEl={anchorEl} placement="bottom-start"
        modifiers={{
          flip: {
            behavior: ["bottom-start", "top-end", "bottom-start"],
            boundariesElement: 'viewport'
          }
        }}
      >
        <div className={classes.filtering}>
          <div className={classes.filterRow}>
            <LWTooltip title={filterModeToTooltip("Hidden")}>
              <span className={classNames(classes.filterButton, {[classes.selected]: mode==="Hidden"})} onClick={ev => onChangeMode("Hidden")}>
                Hidden
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
              <span className={classNames(classes.filterButton, {[classes.selected]: mode==="Default" || mode===0})} onClick={ev => onChangeMode(0)}>
                +0
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
            <LWTooltip title={filterModeToTooltip("Required")}>
              <span className={classNames(classes.filterButton, {[classes.selected]: mode==="Required"})} onClick={ev => onChangeMode("Required")}>
                Required
              </span>
            </LWTooltip>
            <Input 
              className={classes.filterInput} 
              placeholder="Other" 
              type="number" 
              disableUnderline
              classes={{input:classes.input}}
              defaultValue={otherValue} 

              onChange={ev => onChangeMode(parseInt(ev.target.value || "0"))}
            />
            {canRemove && !tag?.suggestedAsFilter &&
              <div className={classes.removeLabel} onClick={ev => {if (onRemove) onRemove()}}>
                <LWTooltip title={<div><div>This filter will no longer appear in Latest Posts.</div><div>You can add it back later if you want</div></div>}>
                  <a>Remove</a>
                </LWTooltip>
              </div>}
          </div>
          {description && <div className={classes.description}>
            {description}
          </div>}
        </div>
        <TagPreview tag={tag} showCount={false} postCount={3}/>
      </PopperCard>
    </AnalyticsContext>
  </span>
}

function filterModeToTooltip(mode: FilterMode): React.ReactNode {
  switch (mode) {
    case "Required":
      return <div><em>Required.</em> ONLY posts with this tag will appear in Latest Posts.</div>
    case "Hidden":
      return <div><em>Hidden.</em> Posts with this tag will be not appear in Latest Posts.</div>
    case 0:
    case "Default":
      return <div><em>+0.</em> This tag will be ignored for filtering and sorting.</div>
    default:
      if (mode<0)
        return <div><em>{mode}.</em> These posts will be shown less often (as though their score were {-mode} points lower).</div>
      else
        return <div><em>+{mode}.</em> These posts will be shown more often (as though their score were {mode} points higher).</div>
  }
}

function filterModeToStr(mode: FilterMode): string {
  if (typeof mode === "number") {
    if (mode>0) return `+${mode}`;
    else if (mode===0) return "";
    else return `${mode}`;
  } else switch(mode) {
    default:
    case "Default": return "";
    case "Hidden": return "Hidden";
    case "Required": return "Required";
  }
}

const FilterModeComponent = registerComponent("FilterMode", FilterModeRawComponent, {styles});

declare global {
  interface ComponentTypes {
    FilterMode: typeof FilterModeComponent
  }
}
