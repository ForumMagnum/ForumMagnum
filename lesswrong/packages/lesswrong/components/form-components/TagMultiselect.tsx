import React, { useCallback, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { styles as inputStyles } from "../ea-forum/onboarding/EAOnboardingInput";
import { isFriendlyUI } from '@/themes/forumTheme';
import { Link } from '@/lib/reactRouterWrapper';
import FormLabel from '@material-ui/core/FormLabel';
import classNames from 'classnames';
import SingleTagItem from "@/components/form-components/SingleTagItem";
import TagsSearchAutoComplete from "@/components/search/TagsSearchAutoComplete";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { SectionTitle } from "@/components/common/SectionTitle";

const styles = (theme: ThemeType) => ({
  label: {
    display: 'block',
    fontSize: 10,
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 12,
  },
  greyContainer: {
    ...inputStyles(theme).root,
    "&:hover, &:focus": {}, // Overwrite styles from above
    padding: 8,
    display: "flex",
    flexWrap: "wrap",
    gap: "2px",
    minHeight: 46,
    [theme.breakpoints.down("xs")]: {
      flexDirection: "column",
    },
  },
  greyInnerContainer: {
    display: "contents",
  },
  greyTagContainer: {
    display: "contents",
  },
  greyTag: {
    height: 30,
    margin: 0,
  },
  inputContainer: {
    display: 'inline-block',
    width: '100%',
    maxWidth: 350,
    border: "none",
    marginBottom: 8,
    '& .SearchAutoComplete-autoComplete input': {
      fontSize: 13
    },
    '& input': {
      width: '100%',
      cursor: "pointer",
    }
  },
  inputGrey: {
    margin: "3px 0 0 8px",
    "& input": {
      fontSize: "14px !important",
    },
  },
  focused: {
    border: theme.palette.border.extraFaint,
    borderRadius: 3,
    padding: 5,
    '& input': {
      cursor: "text"
    }
  },
  profileTagsMessage: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 8,
    "& a": {
      color: theme.palette.primary.main,
      fontWeight: 700,
      "&:hover": {
        color: theme.palette.primary.light,
      },
    },
  },
});

const TagMultiselect = ({
  value,
  path,
  label,
  placeholder,
  hidePostCount=false,
  startWithBorder=false,
  isVotingContext,
  updateCurrentValues,
  variant,
  classes,
}: {
  value: Array<string>,
  path: string,
  label?: string,
  placeholder?: string,
  hidePostCount?: boolean,
  startWithBorder?: boolean,
  isVotingContext?: boolean,
  updateCurrentValues(values: AnyBecauseTodo): void,
  variant?: "default" | "grey",
  classes: ClassesType<typeof styles>,
}) => {
  const [focused, setFocused] = useState(startWithBorder)

  const onFocus = useCallback(() => setFocused(true), []);

  const addTag = useCallback((id: string, tag: SearchTag | null) => {
    const ids = [...(tag?.parentTagId ? [tag.parentTagId] : []), id].filter(id => !value.includes(id))
    if (ids.length) {
      const newValue = value.concat(ids)
      updateCurrentValues({ [path]: newValue })
    }
  }, [value, updateCurrentValues, path]);

  const removeTag = useCallback((id: string) => {
    if (value.includes(id)) {
      updateCurrentValues({ [path]: value.filter(tag => tag !== id) })
    }
  }, [value, updateCurrentValues, path]);
  const isGrey = variant === "grey";
  const labelNode = isGrey
    ? <SectionTitle title={label} noTopMargin titleClassName={classes.sectionTitle} />
    : <FormLabel className={classes.label}>{label}</FormLabel>;

  return (
    <div>
      {label && labelNode}
      {isFriendlyUI && isGrey && path === "profileTagIds" &&
        <div className={classes.profileTagsMessage}>
          These are visible on your profile.{" "}
          If you want to subscribe to topics, go{" "}
          <Link to="/manageSubscriptions">here</Link>.
        </div>
      }
      <div className={classNames(isGrey && classes.greyContainer)}>
        <div className={classNames(isGrey && classes.greyInnerContainer)}>
          <div className={classNames(isGrey && classes.greyTagContainer)}>
            {value.map(tagId => {
              return <SingleTagItem
                key={tagId}
                documentId={tagId}
                onDelete={(_: string) => removeTag(tagId)}
                className={classNames(isGrey && classes.greyTag)}
              />
            })}
          </div>
        </div>
        <ErrorBoundary>
          <div onClick={onFocus} className={classNames(classes.inputContainer, {
            [classes.inputGrey]: isGrey,
            [classes.focused]: focused && !isGrey,
          })}>
            <TagsSearchAutoComplete
              clickAction={(id: string, tag: SearchTag | null) => addTag(id, tag)}
              placeholder={placeholder}
              hidePostCount={hidePostCount}
              facetFilters={{wikiOnly: false}}
              isVotingContext={isVotingContext}
            />
          </div>
        </ErrorBoundary>
      </div>
    </div>
  )
}

const TagMultiselectComponent = registerComponent('TagMultiselect', TagMultiselect, {styles});

declare global {
  interface ComponentTypes {
    TagMultiselect: typeof TagMultiselectComponent
  }
}

export default TagMultiselectComponent;
