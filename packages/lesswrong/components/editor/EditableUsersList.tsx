import React from 'react';
import { makeSortableListComponent } from '../form-components/sortableList';
import SingleUsersItem from "../form-components/SingleUsersItem";
import ErrorBoundary from "../common/ErrorBoundary";
import UsersSearchAutoComplete from "../search/UsersSearchAutoComplete";
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('EditableUsersList', theme => ({
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
}));

const SortableList = makeSortableListComponent({
  RenderItem: ({contents, removeItem}) => {
    const classes = useStyles(styles);
    return <li className={classes.item}>
      <SingleUsersItem userId={contents} removeItem={removeItem} />
    </li>
  }
});

/**
 * An editable list of users, with a straightforward getValue/setValue
 * and no form-system integration.
 */
export function EditableUsersList({value, setValue, label}: {
  value: string[],
  setValue: (newValue: string[]) => void,
  label: string
}) {
  const classes = useStyles(styles);
  
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
    />
  </span>
}
