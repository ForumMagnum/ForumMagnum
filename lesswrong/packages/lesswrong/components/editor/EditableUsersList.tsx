import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import { makeSortableListComponent } from '../form-components/sortableList';
import ErrorBoundary from "@/components/common/ErrorBoundary";
import UsersSearchAutoComplete from "@/components/search/UsersSearchAutoComplete";
import SingleUsersItem from "@/components/form-components/SingleUsersItem";

const styles = (theme: ThemeType) => ({
  listEditor: {
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

const SortableList = makeSortableListComponent({
  renderItem: ({contents, removeItem, classes}) => <li className={classes.item}>
    <SingleUsersItem userId={contents} removeItem={removeItem} />
  </li>
});

/**
 * An editable list of users, with a straightforward getValue/setValue
 * and no form-system integration.
 */
export function EditableUsersList({value, setValue, label, classes}: {
  value: string[],
  setValue: (newValue: string[]) => void,
  label: string,
  classes: ClassesType<typeof styles>,
}) {
  return <span className={classes.listEditor}>
    <ErrorBoundary>
      <UsersSearchAutoComplete
        clickAction={(added: string) => {
          setValue([...value, added]);
        }}
        label={label}
      />
    </ErrorBoundary>
    <SortableList
      value={value}
      setValue={setValue}
      axis="xy"
      className={classes.list}
      classes={classes}
    />
  </span>
}

const EditableUsersListComponent = registerComponent('EditableUsersList', EditableUsersList, {styles});

declare global {
  interface ComponentTypes {
    EditableUsersList: typeof EditableUsersListComponent
  }
}

export default EditableUsersListComponent;
