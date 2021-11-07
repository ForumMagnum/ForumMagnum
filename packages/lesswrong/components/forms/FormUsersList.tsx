import React from 'react';
import { registerComponent, useStyles, Components } from '../../lib/vulcan-lib/components';
import { useFormComponentContext, formCommonStyles, LWForm } from './formUtil';
import { makeSortableListComponent } from './sortableList';
import * as _ from 'underscore';

const styles = (theme: ThemeType): JssStyles => ({
  ...formCommonStyles(theme),
  
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
    <Components.SingleUsersItemWrapper documentId={contents} removeItem={removeItem} />
  </li>
});

// An editable list of users, with a straightforward getValue/setValue
// and no form-system integration.
export function EditableUsersList({value, setValue, label, classes}: {
  value: string[],
  setValue: (newValue: string[])=>void,
  label: string,
  classes: ClassesType,
}) {
  const {ErrorBoundary, UsersSearchAutoComplete} = Components;
  
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

// An editable users list, with all of the wiring to put it in a
// form and enforce it being a valid part of the fragment.
export function FormUsersList<T, FN extends keyof T>({form, fieldName, label}: {
  form: LWForm<T>,
  fieldName: NameOfFieldWithType<T,FN,string[]>,
  label: string,
}) {
  const {value,setValue} = useFormComponentContext<string[],T>(form, fieldName);
  const classes = useStyles(styles, "FormUsersList");
  return <div className={classes.formField}>
    <span className={classes.leftColumn}>{label}</span>
    <span className={classes.rightColumn}>
      <Components.EditableUsersList
        value={value}
        setValue={setValue}
        label={label}
      />
    </span>
  </div>
}

const EditableUsersListComponent = registerComponent('EditableUsersList', EditableUsersList, {styles});
registerComponent('FormUsersList', FormUsersList, {styles});

declare global {
  interface ComponentTypes {
    EditableUsersList: typeof EditableUsersListComponent
    FormUsersList: typeof FormUsersList
  }
}
