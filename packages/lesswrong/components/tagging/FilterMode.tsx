import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import type { FilterMode } from '../../lib/filterSettings';
import classNames from 'classnames';
import { useHover } from '../common/withHover';
import { useSingle } from '../../lib/crud/withSingle';
import { tagStyle } from './FooterTag';
import Input from '@material-ui/core/Input';
import { Link } from '../../lib/reactRouterWrapper';
import { isMobile } from '../../lib/utils/isMobile'
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { userHasNewTagSubscriptions } from '../../lib/betas';
import { useCurrentUser } from '../common/withUser';
import { taggingNameIsSet, taggingNamePluralSetting, taggingNameSetting } from '../../lib/instanceSettings';

export const filteringStyles = (theme: ThemeType) => ({
  paddingLeft: 16,
  paddingTop: 12,
  paddingRight: 16,
  width: 500,
  marginBottom: -4,
  ...theme.typography.commentStyle,
  [theme.breakpoints.down('xs')]: {
    width: "calc(100% - 32px)",
  }
})

const styles = (theme: ThemeType): JssStyles => ({
  tag: {
    ...tagStyle(theme),
    display: "inline-block",
    marginBottom: 4,
    marginRight: 4,
  },
  description: {
    marginTop: 20
  },
  filterScore: {
    color: theme.palette.primary.dark,
    fontSize: 11,
    marginLeft: 4,
  },
  filtering: {
    ...filteringStyles(theme)
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
    color: theme.palette.text.maxIntensity,
    backgroundColor: theme.palette.panelBackground.hoverHighlightGrey,
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
  const { LWTooltip, PopperCard, TagPreview, ContentStyles } = Components
  const { hover, anchorEl, eventHandlers } = useHover({ tagId, label, mode });

  const currentUser = useCurrentUser()
  const { document: tag } = useSingle({
    documentId: tagId,
    collectionName: "Tags",
    fragmentName: "TagPreviewFragment",
    skip: !tagId
  })

  if (mode === "TagDefault" && tag?.defaultFilterMode !== null && tag?.defaultFilterMode !== undefined) {
    // Casting because the generated type does not realize the schema constrains
    // it to be one of the FilterMode values
    mode = tag.defaultFilterMode as FilterMode
  }

  const tagLabel = <span>
    {label}
    <span className={classes.filterScore}>
      {filterModeToStr(mode, currentUser)}
    </span>
  </span>

  const otherValue = ["Hidden", -25,-10,0,10,25,"Required"].includes(mode) ? "" : (mode || "")
  return <span {...eventHandlers} className={classNames(classes.tag, {[classes.noTag]: !tagId})}>
    <AnalyticsContext pageElementContext="tagFilterMode" tagId={tag?._id} tagName={tag?.name}>
      {(tag && !isMobile()) ?
        <Link to={`/${taggingNameIsSet.get() ? taggingNamePluralSetting.get() : 'tag'}/${tag?.slug}`}>
          {tagLabel}
        </Link> :
        tagLabel
      }
      <PopperCard open={!!hover} anchorEl={anchorEl} placement="bottom-start">
        <div className={classes.filtering}>
          <div className={classes.filterRow}>
            <LWTooltip title={filterModeToTooltip("Hidden")}>
              <span className={classNames(classes.filterButton, {[classes.selected]: mode==="Hidden"})} onClick={ev => onChangeMode("Hidden")}>
                Hidden
              </span>
            </LWTooltip>
            <LWTooltip title={filterModeToTooltip("Halved")}>
              <span className={classNames(classes.filterButton, {[classes.selected]: [0.5, "Halved"].includes(mode)})} onClick={ev => onChangeMode("Halved")}>
                Halved
              </span>
            </LWTooltip>
            <LWTooltip title={filterModeToTooltip(-25)}>
              <span className={classNames(classes.filterButton, {[classes.selected]: [-25, "Reduced"].includes(mode)})} onClick={ev => onChangeMode(-25)}>
                {userHasNewTagSubscriptions(currentUser) ? "Reduced" : "-25"}
              </span>
            </LWTooltip>
            {!userHasNewTagSubscriptions(currentUser) && <>
              <LWTooltip title={filterModeToTooltip(-10)}>
                <span className={classNames(classes.filterButton, {[classes.selected]: mode===-10})} onClick={ev => onChangeMode(-10)}>
                  -10
                </span>
              </LWTooltip>
              <LWTooltip
                title={filterModeToTooltip("Default")}
              >
              <span className={classNames(classes.filterButton, {[classes.selected]: mode==="Default" || mode===0})} onClick={ev => onChangeMode(0)}>
                +0
              </span>
              </LWTooltip>
              <LWTooltip title={filterModeToTooltip(10)}>
                <span className={classNames(classes.filterButton, {[classes.selected]: mode===10})} onClick={ev => onChangeMode(10)}>
                  +10
                </span>
              </LWTooltip>
            </>}
            <LWTooltip title={filterModeToTooltip(25)}>
              <span className={classNames(classes.filterButton, {[classes.selected]: [25, "Subscribed"].includes(mode)})} onClick={ev => onChangeMode(25)}>
              {userHasNewTagSubscriptions(currentUser) ? "Subscribed" : "+25"}
              </span>
            </LWTooltip>
            <Input 
              className={classes.filterInput} 
              placeholder="Other" 
              type="number" 
              disableUnderline
              classes={{input:classes.input}}
              value={otherValue}

              onChange={ev => onChangeMode(parseInt(ev.target.value || "0"))}
            />
            {canRemove && !tag?.suggestedAsFilter &&
              <div className={classes.removeLabel} onClick={ev => {if (onRemove) onRemove()}}>
                <LWTooltip title={<div><div>This filter will no longer appear in Latest Posts.</div><div>You can add it back later if you want</div></div>}>
                  <a>Remove</a>
                </LWTooltip>
              </div>}
          </div>
          {description && <ContentStyles contentType="comment" className={classes.description}>
            {description}
          </ContentStyles>}
        </div>
        {tag && <TagPreview tag={tag} showCount={false} postCount={3}/>}
      </PopperCard>
    </AnalyticsContext>
  </span>
}

function filterModeToTooltip(mode: FilterMode): React.ReactNode {
  switch (mode) {
    case "Required":
      return <div><em>Required.</em> ONLY posts with this {taggingNameSetting.get()} will appear in Latest Posts.</div>
    case "Hidden":
      return <div><em>Hidden.</em> Posts with this {taggingNameSetting.get()} will be not appear in Latest Posts.</div>
    case "Halved":
      return <div><em>Halved.</em> Posts with this {taggingNameSetting.get()} with be shown as if they had half as much karma.</div>
    case 0:
    case "Default":
      return <div><em>+0.</em> This {taggingNameSetting.get()} will be ignored for filtering and sorting.</div>
    default:
      if (mode<0)
        return <div><em>{mode}.</em> These posts will be shown less often (as though their score were {-mode} points lower).</div>
      else
        return <div><em>+{mode}.</em> These posts will be shown more often (as though their score were {mode} points higher).</div>
  }
}

function filterModeToStr(mode: FilterMode, currentUser: UsersCurrent | null): string {
  if (typeof mode === "number") {
    if (mode === 25 && userHasNewTagSubscriptions(currentUser)) return "Subscribed"
    if (mode === -25 && userHasNewTagSubscriptions(currentUser)) return "Reduced"
    if (mode > 0) return `+${mode}`
    if (mode === 0) return ""
    return `${mode}`
  } else switch(mode) {
    default:
    case "Default": return "";
    case "Hidden": return "Hidden";
    case "Required": return "Required";
    case "Subscribed": return "Subscribed";
    case "Reduced": return "Reduced";
    case "Halved": return "Halved";
  }
}

const FilterModeComponent = registerComponent("FilterMode", FilterModeRawComponent, {styles});

declare global {
  interface ComponentTypes {
    FilterMode: typeof FilterModeComponent
  }
}
