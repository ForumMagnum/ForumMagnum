import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import FormLabel from '@material-ui/core/FormLabel';

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
    '& input': {
      width: '100%'
    }
  },
});

const TagMultiselect = ({ value, path, classes, label, placeholder, updateCurrentValues }: {
  value: Array<string>,
  path: string,
  classes: ClassesType,
  label?: string,
  placeholder?: string,
  updateCurrentValues<T extends {}>(values: T): void,
}) => {
  const { SingleTagItem, TagsSearchAutoComplete, ErrorBoundary } = Components
  const addTag = (id: string) => {
    if (!value.includes(id)) {
      value.push(id)
      updateCurrentValues({ [path]: value })
    }
  }
  
  const removeTag = (id: string) => {
    if (value.includes(id))
      updateCurrentValues({ [path]: value.filter(tag => tag !== id) })
  }

  return (
    <span className={classes.root}>
      {label && <FormLabel className={classes.label}>{label}</FormLabel>}
      <span className={classes.tags}>
        {value.map(tagId => {
          return <SingleTagItem
            key={tagId}
            documentId={tagId}
            onDelete={(_: string) => removeTag(tagId)}
          />
        })}
      </span>
      <ErrorBoundary>
        <div className={classes.inputContainer}>
          <TagsSearchAutoComplete
            clickAction={(id: string) => addTag(id)}
            placeholder={placeholder}
          />
        </div>
      </ErrorBoundary>
    </span>
  )
}

const TagMultiselectComponent = registerComponent('TagMultiselect', TagMultiselect, {styles});

declare global {
  interface ComponentTypes {
    TagMultiselect: typeof TagMultiselectComponent
  }
}
