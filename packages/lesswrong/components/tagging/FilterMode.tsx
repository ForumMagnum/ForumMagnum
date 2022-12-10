import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { FilterMode, isCustomFilterMode, getStandardFilterModes } from '../../lib/filterSettings';
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
import { forumTypeSetting, taggingNameSetting } from '../../lib/instanceSettings';
import { usePersonalBlogpostInfo } from './usePersonalBlogpostInfo';
import { defaultVisibilityTags } from '../../lib/publicSettings';
import { tagGetUrl } from '../../lib/collections/tags/helpers';

const LATEST_POSTS_NAME = forumTypeSetting.get() === 'EAForum' ? 'Frontpage Posts' : 'Latest Posts';
const INPUT_PAUSE_MILLISECONDS = 1500;

export const filteringStyles = (theme: ThemeType) => ({
  paddingLeft: 16,
  paddingTop: 12,
  paddingRight: 16,
  width: 500,
  marginBottom: 20,
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
    ...filteringStyles(theme),
    marginBottom: 4,
  },
  filterRow: {
    display: "flex",
    justifyContent: "flex-start",
    paddingBottom: 2,
    paddingLeft: 2,
    paddingRight: 2
  },
  rightContainer: {
    display: "flex",
    justifyContent: "flex-end",
    flexGrow: 1,
    "& *": {
      marginLeft: 5,
    },
  },
  defaultLabel: {
    color: theme.palette.primary.main,
    userSelect: "none",
    cursor: "help",
  },
  removeLabel: {
    color: theme.palette.grey[600],
    userSelect: "none",
  },
  filterButton: {
    marginRight: 16,
    color: theme.palette.grey[500],
    ...theme.typography.smallText,
    display: "inline-block",
    cursor: "pointer",
    userSelect: "none",
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
    width: 60,
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

  const standardFilterModes = getStandardFilterModes(currentUser);

  if (mode === "TagDefault" && defaultVisibilityTags.get().find(t => t.tagId === tagId)) {
    // We just found it, it's guaranteed to be in the defaultVisibilityTags list
    mode = defaultVisibilityTags.get().find(t => t.tagId === tagId)!.filterMode
  }
  const reducedName = userHasNewTagSubscriptions(currentUser) ? 'Reduced' : "0.5x"
  const reducedVal = userHasNewTagSubscriptions(currentUser) ? 'Reduced' : 0.5

  const tagLabel = <span>
    {label}
    <span className={classes.filterScore}>
      {filterModeToStr(mode, currentUser)}
    </span>
  </span>

  // When entering a standard value such as 0.5 for "reduced" or 25 for "subscribed" we
  // want to select the button rather than show the input text. This makes it impossible
  // to type, for instance, 0.55 or 250. To avoid this problem we delay for a small amount
  // of time after the user inputs one of these values before we clear the input field in
  // case they continue to type.
  const [inputTime, setInputTime] = useState(0);

  const setMode = (mode: FilterMode, inputTime = 0) => {
    onChangeMode(mode);
    setInputTime(inputTime);
  }

  const handleCustomInput = (input: string) => {
    const parsed = parseFloat(input);
    if (Number.isNaN(parsed)) {
      setMode(0);
    } else {
      const value = parsed <= 0 || parsed >= 1
        ? Math.round(parsed)
        : Math.floor(parsed * 100) / 100;
      const now = Date.now();
      setMode(value, now);
      if (standardFilterModes.includes(value)) {
        setTimeout(() => {
          setInputTime((inputTime) => inputTime === now ? 0 : inputTime);
        }, INPUT_PAUSE_MILLISECONDS);
      }
    }
  }

  const otherValue =
    isCustomFilterMode(currentUser, mode) || (standardFilterModes.includes(mode) && inputTime > 0)
      ? mode
      : "";

  const { name: personalBlogpostName } = usePersonalBlogpostInfo();
  const defaultLabel = label === personalBlogpostName ? "personal blogposts" : `the ${label} ${taggingNameSetting.get()}`;

  return <span {...eventHandlers} className={classNames(classes.tag, {[classes.noTag]: !tagId})}>
    <AnalyticsContext pageElementContext="tagFilterMode" tagId={tag?._id} tagName={tag?.name}>
      {(tag && !isMobile()) ?
        <Link to={tagGetUrl(tag)}>
          {tagLabel}
        </Link> :
        tagLabel
      }
      <PopperCard open={!!hover} anchorEl={anchorEl} placement="bottom-start">
        <div className={classes.filtering}>
          <div className={classes.filterRow}>
            <LWTooltip title={filterModeToTooltip("Hidden")}>
              <span className={classNames(classes.filterButton, {[classes.selected]: mode==="Hidden"})} onClick={ev => setMode("Hidden")}>
                Hidden
              </span>
            </LWTooltip>
            <LWTooltip title={filterModeToTooltip(reducedVal)}>
              <span
                className={classNames(classes.filterButton, {[classes.selected]: [0.5, "Reduced"].includes(mode)})}
                onClick={ev => setMode(reducedVal)}
              >
                {reducedName}
              </span>
            </LWTooltip>
            {!userHasNewTagSubscriptions(currentUser) && <>
              <LWTooltip title={filterModeToTooltip(-25)}>
                <span className={classNames(classes.filterButton, {[classes.selected]: -25 === mode})} onClick={ev => setMode(-25)}>
                  -25
                </span>
              </LWTooltip>
              <LWTooltip title={filterModeToTooltip(-10)}>
                <span className={classNames(classes.filterButton, {[classes.selected]: mode===-10})} onClick={ev => setMode(-10)}>
                  -10
                </span>
              </LWTooltip>
              <LWTooltip
                title={filterModeToTooltip("Default")}
              >
              <span className={classNames(classes.filterButton, {[classes.selected]: mode==="Default" || mode===0})} onClick={ev => setMode(0)}>
                +0
              </span>
              </LWTooltip>
              <LWTooltip title={filterModeToTooltip(10)}>
                <span className={classNames(classes.filterButton, {[classes.selected]: mode===10})} onClick={ev => setMode(10)}>
                  +10
                </span>
              </LWTooltip>
            </>}
            <LWTooltip title={filterModeToTooltip(25)}>
              <span className={classNames(classes.filterButton, {[classes.selected]: [25, "Subscribed"].includes(mode)})} onClick={ev => setMode(25)}>
              {userHasNewTagSubscriptions(currentUser) ? "Subscribed" : "+25"}
              </span>
            </LWTooltip>
            <LWTooltip title={"Enter a custom karma filter. Values between 0 and 1 are multiplicative, other values are absolute changes to the karma of the post."}>
              <Input
                className={classes.filterInput}
                placeholder="Other"
                type="number"
                disableUnderline
                classes={{input:classes.input}}
                value={otherValue}
                onChange={ev => handleCustomInput(ev.target.value || "")}
              />
            </LWTooltip>
            <div className={classes.rightContainer}>
              {userHasNewTagSubscriptions(currentUser) && mode === 0 &&
                <div className={classes.defaultLabel}>
                  <LWTooltip title={`This filter is set to default. Use the controls on the left to customize how much you see ${defaultLabel} in ${LATEST_POSTS_NAME}.`}>
                    Default
                  </LWTooltip>
                </div>}
              {canRemove && !tag?.suggestedAsFilter &&
                <div className={classes.removeLabel} onClick={ev => {if (onRemove) onRemove()}}>
                  <LWTooltip title={<div><div>This filter will no longer appear in {LATEST_POSTS_NAME}.</div><div>You can add it back later if you want</div></div>}>
                    <a>Remove</a>
                  </LWTooltip>
                </div>}
            </div>
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
  // Avoid floating point equality comparisons
  let modeWithoutFloat: FilterMode | "0.5" = mode
  if (
    typeof mode === "number" &&
    Math.abs(0.5 - mode) < .000000001
  ) {
    modeWithoutFloat = "0.5"
  }
  switch (modeWithoutFloat) {
    case "Required":
      return <div><em>Required.</em> ONLY posts with this {taggingNameSetting.get()} will appear in {LATEST_POSTS_NAME}.</div>
    case "Hidden":
      return <div><em>Hidden.</em> Posts with this {taggingNameSetting.get()} will be not appear in {LATEST_POSTS_NAME}.</div>
    case "Reduced":
      return <div><em>Reduced.</em> Posts with this {taggingNameSetting.get()} with be shown as if they had half as much karma.</div>
    case "0.5":
      return <div><em>0.5x</em> Posts with this {taggingNameSetting.get()} with be shown as if they had half as much karma.</div>
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
    if (
      // Avoid floating point eqality comparisons
      Math.abs(0.5 - mode) < .000000001 &&
      userHasNewTagSubscriptions(currentUser)
    ) return "Reduced"
    if (mode >= 1) return `+${mode}`
    if (mode > 0) return `-${Math.round((1 - mode) * 100)}%`
    if (mode === 0) return ""
    return `${mode}`
  } else switch(mode) {
    default:
    case "Default": return "";
    case "Hidden": return "Hidden";
    case "Required": return "Required";
    case "Subscribed": return "Subscribed";
    case "Reduced": return "Reduced";
  }
}

const FilterModeComponent = registerComponent("FilterMode", FilterModeRawComponent, {styles});

declare global {
  interface ComponentTypes {
    FilterMode: typeof FilterModeComponent
  }
}
