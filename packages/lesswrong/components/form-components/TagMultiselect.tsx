import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withUser from '../common/withUser';
import FormControl from '@material-ui/core/FormControl';
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
    border: theme.palette.border.normal,
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
    '& input': {
      width: '100%'
    }
  },
});

const TagMultiselect = ({ value, path, document, classes, label, placeholder, updateCurrentValues }: {
  value: Array<string>,
  path: string,
  document: any,
  classes: ClassesType,
  label?: string,
  placeholder?: string,
  updateCurrentValues<T extends {}>(values: T): void,
}) => {
  
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
    <div className={classes.root}>
      <FormLabel className={classes.label}>{label}</FormLabel>
      <div className={classes.tags}>
        {value.map(tagId => {
          return <Components.SingleTagItem
            key={tagId}
            documentId={tagId}
            onDelete={(_: string) => removeTag(tagId)}
          />
        })}
      </div>
      <Components.ErrorBoundary>
        <div className={classes.inputContainer}>
          <Components.TagsSearchAutoComplete
            clickAction={(id: string) => addTag(id)}
            placeholder={placeholder}
          />
        </div>
      </Components.ErrorBoundary>
    </div>
  )
}

const TagMultiselectComponent = registerComponent('TagMultiselect', TagMultiselect, {
  styles: styles,
  hocs: [withUser],
});

declare global {
  interface ComponentTypes {
    TagMultiselect: typeof TagMultiselectComponent
  }
}
