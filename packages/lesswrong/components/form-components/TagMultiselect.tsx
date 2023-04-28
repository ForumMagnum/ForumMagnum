import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import FormLabel from '@material-ui/core/FormLabel';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  label: {
    display: 'block',
    fontSize: 10,
    marginBottom: 8
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
  focused: {
    border: theme.palette.border.extraFaint,
    borderRadius: 3,
    padding: 5,
    '& input': {
      cursor: "text"
    }
  }
});

const TagMultiselect = ({ value, path, classes, label, placeholder, hidePostCount=false, startWithBorder=false,isVotingContext, updateCurrentValues }: {
  value: Array<string>,
  path: string,
  classes: ClassesType,
  label?: string,
  placeholder?: string,
  hidePostCount?: boolean,
  startWithBorder?: boolean,
  isVotingContext?: boolean,
  updateCurrentValues(values: AnyBecauseTodo): void,
}) => {
  const { SingleTagItem, TagsSearchAutoComplete, ErrorBoundary } = Components

  const [focused, setFocused] = useState(startWithBorder)

  const addTag = (id: string, tag: AlgoliaTag | null) => {
    const ids = [...(tag?.parentTagId ? [tag.parentTagId] : []), id].filter(id => !value.includes(id))
    if (ids.length) {
      const newValue = value.concat(ids)
      updateCurrentValues({ [path]: newValue })
    }
  }
  
  const removeTag = (id: string) => {
    if (value.includes(id)) {
      updateCurrentValues({ [path]: value.filter(tag => tag !== id) })
    }
  }

  return (
    <div className={classes.root}>
      {label && <FormLabel className={classes.label}>{label}</FormLabel>}
      <div className={classes.tags}>
        {value.map(tagId => {
          return <SingleTagItem
            key={tagId}
            documentId={tagId}
            onDelete={(_: string) => removeTag(tagId)}
          />
        })}
      </div>
      <ErrorBoundary>
        <div className={classNames(classes.inputContainer, {[classes.focused]:focused})} onClick={() => setFocused(true)}>
          <TagsSearchAutoComplete
            clickAction={(id: string, tag: AlgoliaTag | null) => addTag(id, tag)}
            placeholder={placeholder}
            hidePostCount={hidePostCount}
            filters="wikiOnly:false"
            isVotingContext={isVotingContext}
          />
        </div>
      </ErrorBoundary>
    </div>
  )
}

const TagMultiselectComponent = registerComponent('TagMultiselect', TagMultiselect, {styles});

declare global {
  interface ComponentTypes {
    TagMultiselect: typeof TagMultiselectComponent
  }
}
