import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { makeSortableListComponent } from '../form-components/sortableList';
import { SingleUsersItem } from "../form-components/SingleUsersItem";
import { ErrorBoundary } from "../common/ErrorBoundary";
import { UsersSearchAutoComplete } from "../search/UsersSearchAutoComplete";

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
export function EditableUsersListInner({value, setValue, label, classes}: {
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

export const EditableUsersList = registerComponent('EditableUsersList', EditableUsersListInner, {styles});

declare global {
  interface ComponentTypes {
    EditableUsersList: typeof EditableUsersList
  }
}
