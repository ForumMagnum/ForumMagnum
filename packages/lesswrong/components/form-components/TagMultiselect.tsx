import React, { ReactNode, useEffect, useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withUser from '../common/withUser';
import { useSingle } from '../../lib/crud/withSingle';
import Chip from '@material-ui/core/Chip/Chip';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import { useMulti } from '../../lib/crud/withMulti';

const styles = (theme: ThemeType): JssStyles => ({
  fieldRow: {
    display: 'flex',
  },
  label: {
    fontSize: 10,
    marginBottom: 8
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

  // useEffect(() => {
  //   // updateCurrentValues needs to be called after loading the TagBasicInfo query because
  //   // when the query returns `value` gets set back to undefined for some reason. I think this
  //   // is probably because it updates local storage somehow, but I'm not sure. This fixes it anyway
  //   if (!loading && value !== currentId) {
  //     updateCurrentValues({ [path]: currentId })
  //   }
  // }, [currentId, value, updateCurrentValues, path, loading])
  
  const addTag = (id: string) => {
    console.log('addTag', id)
    if (!value.includes(id))
      value.push(id)
      updateCurrentValues({ [path]: value })
  }
  
  const removeTag = (id: string) => {
    if (value.includes(id))
      updateCurrentValues({ [path]: value.filter(tag => tag !== id) })
  }

  return (
    <FormControl className={classes.root}>
      <FormLabel className={classes.label}>{label}</FormLabel>
      <div className={classes.fieldRow}>
        <Components.ErrorBoundary>
          <Components.TagsSearchAutoComplete
            clickAction={(id: string) => addTag(id)}
            placeholder={placeholder}
          />
        </Components.ErrorBoundary>
        {value.map(tagId => {
          return <Components.SingleTagItem
            key={tagId}
            documentId={tagId}
            onDelete={(_: string) => removeTag(tagId)}
          />
        })}
      </div>
    </FormControl>
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
