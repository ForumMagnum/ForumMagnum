import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { FilterMode as FilterModeType, isCustomFilterMode, getStandardFilterModes } from '../../lib/filterSettings';
import classNames from 'classnames';
import { useHover } from '../common/withHover';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import { Link } from '../../lib/reactRouterWrapper';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { userHasNewTagSubscriptions } from '../../lib/betas';
import { useCurrentUser } from '../common/withUser';
import { taggingNameSetting } from '../../lib/instanceSettings';
import { defaultVisibilityTags } from '../../lib/publicSettings';
import { tagGetUrl } from '../../lib/collections/tags/helpers';
import { forumSelect } from '../../lib/forumTypeUtils';
import VisibilityOff from '@/lib/vendor/@material-ui/icons/src/VisibilityOff';
import { isFriendlyUI } from '../../themes/forumTheme';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import LWTooltip from "../common/LWTooltip";
import PopperCard from "../common/PopperCard";
import TagPreview from "./TagPreview";
import ContentStyles from "../common/ContentStyles";


const TagPreviewFragmentQuery = gql(`
  query FilterMode($documentId: String) {
    tag(input: { selector: { documentId: $documentId } }) {
      result {
        ...TagPreviewFragment
      }
    }
  }
`);

const LATEST_POSTS_NAME = isFriendlyUI ? 'Frontpage Posts' : 'Latest Posts';
const INPUT_PAUSE_MILLISECONDS = 1500;

export const filteringStyles = (theme: ThemeType) => ({
  paddingLeft: 16,
  paddingTop: 12,
  paddingRight: 16,
  width: 500,
  marginBottom: 0,
  ...theme.typography.commentStyle,
  [theme.breakpoints.down('xs')]: {
    width: "calc(100% - 32px)",
  }
})

const styles = (theme: ThemeType) => ({
  tag: {
    padding: 8,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: theme.palette.panelBackground.default,
    border: theme.palette.tag.border,
    borderRadius: 3,
    ...theme.typography.commentStyle,
    display: "inline-block",
    flexGrow: 1,
    textAlign: "center",
    fontWeight: theme.typography.body1.fontWeight,
    color: isFriendlyUI ? theme.palette.lwTertiary.main : theme.palette.primary.main,
    boxShadow: theme.palette.boxShadow.default,
    ...(isFriendlyUI ? {
      marginBottom: 4,
      marginRight: 4,
    } : {
      maxWidth: 180,
      whiteSpace: "nowrap",
    }),
  },
  description: {
    marginTop: 20
  },
  tagLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: theme.typography.body1.fontWeight,
    overflow: isFriendlyUI ? undefined : 'hidden',
  },
  filterScore: {
    color: theme.palette.primary.main,
    lineHeight: '8px',
    marginLeft: 7,
    '& svg': {
      height: '0.5em',
      width: '0.5em'
    }
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
    
    ...(isFriendlyUI && {
      color: theme.palette.primary.main
    }),
  },
  input: {
    padding: 0,
    paddingBottom: 2,
    width: 60,
    "-webkit-appearance": "none",
    "-moz-appearance": "textfield"
  },
  tagPreview: {
    paddingBottom: 4
  },
  hideOnMobile: {
    [theme.breakpoints.down('sm')]: {
      display: "none",
    },
  },
  hideOnDesktop: {
    [theme.breakpoints.up('md')]: {
      display: "none",
    },
  },
});

const FilterModeRawComponent = ({tagId="", label, mode, canRemove=false, onChangeMode, onRemove, description, classes}: {
  tagId?: string,
  label?: string,
  mode: FilterModeType,
  canRemove?: boolean,
  onChangeMode: (mode: FilterModeType) => void,
  onRemove?: () => void,
  description?: React.ReactNode
  classes: ClassesType<typeof styles>,
}) => {
  const { hover, anchorEl, eventHandlers } = useHover({
    eventProps: {tagId, label, mode},
  });

  const currentUser = useCurrentUser()
  const { data } = useQuery(TagPreviewFragmentQuery, {
    variables: { documentId: tagId },
    skip: !tagId,
    ssr: false,
  });
  const tag = data?.tag?.result;

  const standardFilterModes = getStandardFilterModes();

  if (mode === "TagDefault" && defaultVisibilityTags.get().find(t => t.tagId === tagId)) {
    // We just found it, it's guaranteed to be in the defaultVisibilityTags list
    mode = defaultVisibilityTags.get().find(t => t.tagId === tagId)!.filterMode
  }
  
  const reducedName = 'Reduced'
  const reducedVal = 'Reduced'
  const filterMode = filterModeToStr(mode, currentUser)
  const filterModeLabel = filterModeStrToLabel(filterMode);

  const tagLabel =
    <span className={classes.tagLabel}>
      {label}
      {filterMode !== '' &&
        <span className={classes.filterScore}>
          {filterModeLabel}
        </span>
      }
    </span>

  // When entering a standard value such as 0.5 for "reduced" or 25 for "subscribed" we
  // want to select the button rather than show the input text. This makes it impossible
  // to type, for instance, 0.55 or 250. To avoid this problem we delay for a small amount
  // of time after the user inputs one of these values before we clear the input field in
  // case they continue to type.
  const [inputTime, setInputTime] = useState(0);

  const setMode = (mode: FilterModeType, inputTime = 0) => {
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
    isCustomFilterMode(mode) || (standardFilterModes.includes(mode) && inputTime > 0)
      ? mode
      : "";

  const tagPreviewPostCount = forumSelect({
    LessWrong: 0,
    default: 3
  });

  // Show a `+` in front of the custom "other" input if there's a custom additive value (rather than multiplicative)
  const showPlusSign = typeof otherValue === 'number' && otherValue >= 1;

  return <span {...eventHandlers} className={classes.tag}>
    <AnalyticsContext pageElementContext="tagFilterMode" tagId={tagId} tagName={tagLabel}>
      {tag ? (
        <>
          <Link to={tagGetUrl(tag)} className={classes.hideOnMobile}>
            {tagLabel}
          </Link>
          <span className={classes.hideOnDesktop}>
            {tagLabel}
          </span>
        </>
      ) : tagLabel}
      <PopperCard open={!!hover} anchorEl={anchorEl} placement="bottom-start">
        <div className={classes.filtering}>
          <div className={classes.filterRow}>
            <LWTooltip title={filterModeToTooltip("Hidden")}>
              <span className={classNames(classes.filterButton, {[classes.selected]: mode==="Hidden"})} onClick={_ev => setMode("Hidden")}>
                Hidden
              </span>
            </LWTooltip>
            <LWTooltip title={filterModeToTooltip(reducedVal)}>
              <span
                className={classNames(classes.filterButton, {[classes.selected]: [0.5, "Reduced"].includes(mode)})}
                onClick={_ev => setMode(reducedVal)}
              >
                {reducedName}
              </span>
            </LWTooltip>
            <div className={classes.defaultLabel}>
              <LWTooltip title={filterModeToTooltip("Default")}>
                <span className={classNames(classes.filterButton, {[classes.selected]: mode===0 || mode==="Default"})} onClick={_ev => setMode("Default")}>
                  Default
                </span>
              </LWTooltip>
            </div>
            <LWTooltip title={filterModeToTooltip(25)}>
              <span className={classNames(classes.filterButton, {[classes.selected]: [25, "Subscribed"].includes(mode)})} onClick={_ev => setMode(25)}>
              {userHasNewTagSubscriptions(currentUser) ? "Subscribed" : "Promoted"}
              </span>
            </LWTooltip>
            <LWTooltip title={"Enter a custom karma filter. Values between 0 and 1 are multiplicative, other values are absolute changes to the karma of the post."}>
              {showPlusSign && <span>+</span>}
              <span className={classes.filterButton}>
                <Input
                  placeholder="Other"
                  type="number"
                  disableUnderline
                  classes={{input:classes.input}}
                  value={otherValue}
                  onChange={ev => handleCustomInput(ev.target.value || "")}
                />
              </span>
            </LWTooltip>
            <div className={classes.rightContainer}>
              {canRemove && !tag?.suggestedAsFilter &&
                <div className={classes.removeLabel} onClick={_ev => {if (onRemove) onRemove()}}>
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
        {tag &&
          <div className={classes.tagPreview}>
            <TagPreview tag={tag} showCount={false} postCount={tagPreviewPostCount}/>
          </div>
        }
      </PopperCard>
    </AnalyticsContext>
  </span>
}

function filterModeToTooltip(mode: FilterModeType): React.ReactNode {
  // Avoid floating point equality comparisons
  let modeWithoutFloat: FilterModeType | "0.5" = mode
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
      return <div>This {taggingNameSetting.get()} will have default filtering and sorting.</div>
    default:
      if (typeof mode==="number" && mode<0)
        return <div><em>{mode}.</em> These posts will be shown less often (as though their score were {-mode} points lower).</div>
      else
        return <div><em>+{mode}.</em> These posts will be shown more often (as though their score were {mode} points higher).</div>
  }
}

type FilterModeString = 
  | `${number}`
  | `+${number}`
  | `-${number}%`
  | "Hidden"
  | "Required"
  | "Subscribed"
  | "Reduced"
  | "";

function filterModeToStr(mode: FilterModeType, currentUser: UsersCurrent | null): FilterModeString {
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

/**
 * This function used to change the label to a LW-specific label, while the EA forum had a different label.
 * Now, it, along with {@link filterModeToStr}, should probably be refactored (collapsed).
 */
function filterModeStrToLabel(filterModeStr: FilterModeString) {
  switch (filterModeStr) {
    case 'Reduced':     return '-';
    case 'Subscribed':  return '+';
    case '':            return '';
    case 'Hidden':      return <VisibilityOff />; //'Hidden';
    case 'Required':    return 'Required';
    default: {
      if (filterModeStr.startsWith('-')) return '-';
      if (filterModeStr.startsWith('+')) return '+';
      // filterModeStr is a negative number
      return '-';
    }
  }
}

export default registerComponent("FilterMode", FilterModeRawComponent, {styles});


