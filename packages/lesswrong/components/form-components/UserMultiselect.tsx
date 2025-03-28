import React, {useCallback} from 'react';
import { makeSortableListComponent } from './sortableList';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
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

const UserMultiselect = ({value, setValue, label, classes}: {
  value: string[],
  setValue: (newValue: string[]) => void
  label: string,
  classes: ClassesType<typeof styles>,
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

const FormUserMultiselect = ({value, path, label, updateCurrentValues}: {
  value: string[],
  path: string,
  label: string,
  updateCurrentValues: UpdateCurrentValues,
}) => {
  const setValue = useCallback((newValue: string[]) => {
    void updateCurrentValues({[path]: newValue});
  }, [updateCurrentValues, path]);

  return <UserMultiselectComponent
    value={value}
    setValue={setValue}
    label={label}
  />
};

const UserMultiselectComponent = registerComponent("UserMultiselect", UserMultiselect, {styles});
const FormUserMultiselectComponent = registerComponent("FormUserMultiselect", FormUserMultiselect, {styles});

declare global {
  interface ComponentTypes {
    UserMultiselect: typeof UserMultiselectComponent
    FormUserMultiselect: typeof FormUserMultiselectComponent
  }
}
