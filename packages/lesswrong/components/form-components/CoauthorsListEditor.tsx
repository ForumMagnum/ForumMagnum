import React, { useState, useCallback } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Checkbox from '@material-ui/core/Checkbox';
import { makeSortableListComponent } from './sortableList';
import find from 'lodash/find';
import InputLabel from '@material-ui/core/InputLabel';
import {isEAForum} from '../../lib/instanceSettings';

const coauthorsListEditorStyles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    marginLeft: 8,
    marginTop: -12,
  },
  list: {
    display: "flex",
    flexWrap: "wrap"
  },
  item: {
    listStyle: "none",
    fontFamily: theme.typography.fontFamily
  },
  checkbox: {
    padding: '6px',
  },
  checkboxContainer: {
    margin: '10px 0 -8px 0'
  },
  checkboxLabel: {
    fontSize: '1.1rem',
    fontWeight: theme.typography.body1.fontWeight ?? 400,
    color: theme.palette.text.normal,
    cursor: 'pointer'
  },
});

type CoauthorListItem = {
  userId: string
  confirmed: boolean
  requested: boolean
}

const SortableList = makeSortableListComponent({
  renderItem: ({contents, removeItem, classes}) => {
    return <li className={classes.item}>
      <Components.SingleUsersItem userId={contents} removeItem={removeItem} />
    </li>
  }
});

const CoauthorsListEditor = ({ value, path, document, classes, label, updateCurrentValues }: FormComponentProps<CoauthorListItem> & {
  value: CoauthorListItem[],
  document: Partial<DbPost>,
  classes: ClassesType<typeof coauthorsListEditorStyles>,
}) => {
  const [initialValue] = useState(value);
  const hasPermission = !!document.hasCoauthorPermission;
  
  const toggleHasPermission = () => {
    const newValue = value.map((author) => ({ ...author, confirmed: !hasPermission }));
    void updateCurrentValues({
      [path]: newValue,
      hasCoauthorPermission: !hasPermission,
    });
  }

  // Note: currently broken. This component needs to somehow deal with lists of objects instead of strings
  const addUserId = (userId: string) => {
    const newValue = [...value, { userId, confirmed: hasPermission, requested: false }];
    void updateCurrentValues({ [path]: newValue });
  }

  const setValue = useCallback((newValue: any[]) => {
    void updateCurrentValues({[path]: newValue});
  }, [updateCurrentValues, path]);

  return (
    <>
      <div className={classes.root}>
        <Components.ErrorBoundary>
          <Components.UsersSearchAutoComplete 
            clickAction={addUserId} 
            label={document.collabEditorDialogue ? "Add participant" : label} 
            />
        </Components.ErrorBoundary>
        <SortableList
          axis="xy"
          value={value.map(v=>v.userId)}
          setValue={(newValue: string[]) => {
            setValue(newValue.map(userId => {
              const userWithStatus = find(initialValue, u=>u.userId===userId);
              return {
                userId,
                confirmed: userWithStatus?.confirmed||false,
                requested: userWithStatus?.confirmed||false,
              };
            }));
          }}
          className={classes.list}
          classes={classes}
        />
      </div>
      {isEAForum && <div className={classes.checkboxContainer}>
        <Components.LWTooltip
          title='If this box is left unchecked then these users will be asked if they want to be co-authors. If you click Publish with pending co-authors, publishing will be delayed for up to 24 hours to allow for co-authors to give permission.'
          placement='left'
        >
          <InputLabel className={classes.checkboxLabel}>
            <Checkbox className={classes.checkbox} checked={hasPermission} onChange={toggleHasPermission} />
            These users have agreed to co-author this post
          </InputLabel>
        </Components.LWTooltip>
      </div>}
    </>
  );
}

const CoauthorsListEditorComponent = registerComponent('CoauthorsListEditor', CoauthorsListEditor, {
  styles: coauthorsListEditorStyles,
});

declare global {
  interface ComponentTypes {
    CoauthorsListEditor: typeof CoauthorsListEditorComponent
  }
}
