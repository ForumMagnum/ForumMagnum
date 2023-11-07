import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import { makeSortableListComponent } from './sortableList';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "center"
  },
  list: {
    display: "flex",
    flexWrap: "wrap"
  },
  item: {
    listStyle: "none",
    fontFamily: theme.typography.fontFamily
  },
});

export const SortableList = makeSortableListComponent({
  renderItem: ({contents, removeItem, classes}) => {
    return <li className={classes.item}>
      <Components.SingleUsersItem userId={contents} removeItem={removeItem} />
    </li>
  }
});

const UsersListEditor = ({value, setValue, label, classes}: {
  value: string[],
  setValue: (newValue: string[])=>void
  label: string,
  classes: ClassesType,
}) => {
  return (
    <div className={classes.root}>
      <Components.ErrorBoundary>
        <Components.UsersSearchAutoComplete
          clickAction={(userId: string) => {
            setValue([...value, userId]);
          }}
          label={label}
        />
      </Components.ErrorBoundary>
      <SortableList
        axis="xy"
        value={value}
        setValue={setValue}
        className={classes.list}
        classes={classes}
      />
    </div>
  )
}

const FormUsersListEditor = ({value, path, label}: {
  value: string[],
  path: string,
  label: string,
}, context: any) => {
  const { updateCurrentValues } = context;
  
  const setValue = useCallback((newValue: string[]) => {
    updateCurrentValues({[path]: newValue});
  }, [updateCurrentValues, path]);
  
  return <Components.UsersListEditor
    value={value}
    setValue={setValue}
    label={label}
  />
};

(FormUsersListEditor as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
};

const UsersListEditorComponent = registerComponent("UsersListEditor", UsersListEditor, {styles});
const FormUsersListEditorComponent = registerComponent("FormUsersListEditor", FormUsersListEditor);

declare global {
  interface ComponentTypes {
    UsersListEditor: typeof UsersListEditorComponent
    FormUsersListEditor: typeof FormUsersListEditorComponent
  }
}
