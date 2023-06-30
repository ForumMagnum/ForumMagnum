import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import { makeSortableListComponent } from './sortableList';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex"
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

const FormUsersListEditor = ({value, path, label}: {
  value: string[],
  path: string,
  label: string,
  classes: ClassesType,
}, context: any) => {
  const { updateCurrentValues } = context;
  
  const setValue = useCallback((newValue: string[]) => {
    updateCurrentValues({[path]: newValue});
  }, [updateCurrentValues, path]);
  
  return <Components.UsersListEditor label={label} value={value} setValue={setValue}/>
};

(FormUsersListEditor as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
};

const UsersListEditor = ({label, value, setValue, classes}: {
  label: string,
  value: string[],
  setValue: (newValue: string[])=>void,
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


const FormUsersListEditorComponent = registerComponent("FormUsersListEditor", FormUsersListEditor);
const UsersListEditorComponent = registerComponent("UsersListEditor", UsersListEditor, {styles});

declare global {
  interface ComponentTypes {
    FormUsersListEditor: typeof FormUsersListEditorComponent
    UsersListEditor: typeof UsersListEditorComponent
  }
}
